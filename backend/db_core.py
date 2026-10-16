"""Database access layer for ASHA-Sahayi (SQLite, parameterised queries only)."""
from __future__ import annotations

import re
import sqlite3
import uuid
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
DB_PATH = HERE / "asha_sahayi.db"


class ValidationError(ValueError):
    """Maps to HTTP 422/400."""


class DuplicateError(ValueError):
    """Maps to HTTP 409."""


class NotFoundError(LookupError):
    """Maps to HTTP 404."""


def connect(path: str | Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(path), isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")   # TC-10 concurrent writes
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript((HERE / "schema.sql").read_text(encoding="utf-8"))


def _audit(conn, table, rid, field, old, new, user):
    conn.execute(
        "INSERT INTO audit_log(table_name, record_id, field, old_value, new_value, changed_by) VALUES (?,?,?,?,?,?)",
        (table, rid, field, None if old is None else str(old), None if new is None else str(new), user),
    )


# ---------------- Households ----------------
def create_household(conn, head_name, ward_id, address=None, phone=None, latitude=None, longitude=None) -> str:
    if not head_name or not str(head_name).strip() or not ward_id or not str(ward_id).strip():
        raise ValidationError("head_name and ward_id are required")            # TC-01
    if latitude is not None and not -90 <= latitude <= 90:
        raise ValidationError("latitude out of range")                         # TC-02
    if longitude is not None and not -180 <= longitude <= 180:
        raise ValidationError("longitude out of range")
    dup = conn.execute(
        "SELECT id FROM households WHERE ward_id=? AND lower(head_name)=lower(?) AND phone IS ? AND is_deleted=0",
        (ward_id, head_name.strip(), phone),
    ).fetchone()
    if dup:
        raise DuplicateError(f"Duplicate household; consider merging with {dup['id']}")  # TC-03
    hid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO households(id, head_name, ward_id, address, phone, latitude, longitude) VALUES (?,?,?,?,?,?,?)",
        (hid, head_name.strip(), ward_id, address, phone, latitude, longitude),
    )
    return hid


def search_households(conn, q: str):
    like = f"%{q}%"                                                            # TC-11: bound parameter
    return conn.execute(
        """SELECT DISTINCT h.* FROM households h LEFT JOIN members m ON m.household_id = h.id
           WHERE h.is_deleted=0 AND (h.head_name LIKE ? OR h.address LIKE ? OR m.name LIKE ? OR m.name_ml LIKE ?)""",
        (like, like, like, like),
    ).fetchall()


def delete_household(conn, hid: str) -> None:
    active = conn.execute("SELECT count(*) FROM members WHERE household_id=?", (hid,)).fetchone()[0]
    if active:
        raise DuplicateError("Household has active members; soft-delete only")  # TC-09 (409)
    conn.execute("UPDATE households SET is_deleted=1, updated_at=datetime('now') WHERE id=?", (hid,))


# ---------------- Members ----------------
def _age_years(dob: str | None, today: date | None = None) -> float | None:
    if not dob:
        return None
    d = date.fromisoformat(dob)
    return round(((today or date.today()) - d).days / 365.25, 2)


def categorise(sex, age_years, is_pregnant) -> str:                            # TC-06
    if is_pregnant and sex == "F":
        return "ANC"
    if age_years is not None and age_years < 5:
        return "CHILD"
    return "GENERAL"


def add_member(conn, household_id, name, sex=None, dob=None, age_years=None, relation=None,
               phone=None, is_pregnant=False, lmp_date=None, edd_date=None, name_ml=None) -> str:
    if age_years is None:
        age_years = _age_years(dob)
    if age_years is not None and not 0 <= age_years <= 120:
        raise ValidationError("age must be between 0 and 120")                 # TC-05
    if not conn.execute("SELECT 1 FROM households WHERE id=? AND is_deleted=0", (household_id,)).fetchone():
        raise NotFoundError(f"household {household_id} not found")             # TC-13
    mid = str(uuid.uuid4())
    try:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """INSERT INTO members(id, household_id, name, name_ml, sex, dob, age_years, relation, phone,
                                   is_pregnant, lmp_date, edd_date, category)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (mid, household_id, name, name_ml, sex, dob, age_years, relation, phone, int(is_pregnant),
             lmp_date, edd_date, categorise(sex, age_years, is_pregnant)),
        )
        conn.execute("COMMIT")
    except sqlite3.IntegrityError as e:
        conn.execute("ROLLBACK")
        raise NotFoundError(str(e)) from e
    return mid


def update_member(conn, member_id, changed_by="system", **fields) -> None:   # TC-07
    allowed = {"name", "name_ml", "phone", "relation", "dob", "is_pregnant", "lmp_date", "edd_date", "high_risk"}
    row = conn.execute("SELECT * FROM members WHERE id=?", (member_id,)).fetchone()
    if not row:
        raise NotFoundError(member_id)
    conn.execute("BEGIN IMMEDIATE")
    for k, v in fields.items():
        if k not in allowed:
            conn.execute("ROLLBACK")
            raise ValidationError(f"field {k} not editable")
        if row[k] != v:
            conn.execute(f"UPDATE members SET {k}=?, updated_at=datetime('now') WHERE id=?", (v, member_id))
            _audit(conn, "members", member_id, k, row[k], v, changed_by)
    conn.execute("COMMIT")


def record_vaccine(conn, member_id, code, given_date=None, status="GIVEN", note=None, changed_by="system"):
    conn.execute(
        "INSERT INTO immunizations(member_id, vaccine_code, given_date, status, source_note) VALUES (?,?,?,?,?)",
        (member_id, code, given_date, status, note),
    )
    _audit(conn, "immunizations", member_id, code, None, given_date or status, changed_by)


# ---------------- Knowledge retrieval ----------------
def search_knowledge(conn, query: str, k: int = 5):
    terms = re.findall(r"\w+", query, flags=re.UNICODE)
    if not terms:
        return []
    fts_q = " OR ".join(f'"{t}"' for t in terms)
    return conn.execute(
        """SELECT c.id, d.filename, c.page, c.content, bm25(knowledge_fts) AS score
           FROM knowledge_fts JOIN knowledge_chunks c ON c.id = knowledge_fts.rowid
           JOIN documents d ON d.id = c.document_id
           WHERE knowledge_fts MATCH ? ORDER BY score LIMIT ?""",
        (fts_q, k),
    ).fetchall()


def household_bundle(conn, hid: str) -> dict:
    h = conn.execute("SELECT * FROM households WHERE id=?", (hid,)).fetchone()
    if not h:
        raise NotFoundError(hid)
    members = []
    for m in conn.execute("SELECT * FROM members WHERE household_id=? ORDER BY age_years DESC", (hid,)):
        imms = conn.execute(
            "SELECT vaccine_code, given_date, status FROM immunizations WHERE member_id=? ORDER BY given_date", (m["id"],)
        ).fetchall()
        flags = conn.execute(
            "SELECT flag_type, priority, reason, due_date FROM followup_flags WHERE member_id=? AND resolved=0", (m["id"],)
        ).fetchall()
        members.append({**dict(m), "immunizations": [dict(i) for i in imms], "flags": [dict(f) for f in flags]})
    notes = conn.execute("SELECT visit_date, language, raw_text FROM visit_notes WHERE household_id=?", (hid,)).fetchall()
    return {"household": dict(h), "members": members, "visit_notes": [dict(n) for n in notes]}
