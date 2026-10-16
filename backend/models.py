"""Data-access layer shaped for the frontend (camelCase house objects).

Wraps db_core (validated SQL) and rule_engine (deterministic vaccine / ANC rules).
"""
from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from datetime import date, timedelta

from . import db_core as db
from . import rule_engine

PENDING_RE = re.compile(r"pending|missed|overdue|വാക്സിൻ", re.I)
PREG_RE = re.compile(r"pregnan|ഗർഭിണി", re.I)
CODE_RE = re.compile(r"^([A-Za-z0-9\-]+)")


# ---------------- passwords ----------------
def hash_password(pw: str) -> str:
    salt = secrets.token_hex(8)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000)
    return f"{salt}${dk.hex()}"


def verify_password(pw: str, stored: str | None) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except (ValueError, AttributeError):
        return False
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120_000)
    return hmac.compare_digest(dk.hex(), digest)


# ---------------- lookups ----------------
def _house_row(conn, house_no: str):
    row = conn.execute(
        "SELECT * FROM households WHERE house_no=? AND is_deleted=0", (house_no,)
    ).fetchone()
    if not row:
        raise db.NotFoundError(f"House number {house_no} not found")
    return row


def get_house_id(conn, house_no: str) -> str:
    return _house_row(conn, house_no)["id"]


def _flags(conn, member_id: str):
    return conn.execute(
        "SELECT flag_type, priority, reason FROM followup_flags WHERE member_id=? AND resolved=0",
        (member_id,),
    ).fetchall()


def _codes(flags, flag_type: str) -> list[str]:
    out = []
    for f in flags:
        m = CODE_RE.match(f["reason"])
        if f["flag_type"] == flag_type and m:
            out.append(m.group(1))
    return out


def _short(codes: list[str], n: int = 3) -> str:
    return ", ".join(codes[:n]) + (f" +{len(codes) - n} more" if len(codes) > n else "")


def _status_text(m, flags) -> str:
    parts = []
    if m["health_note"]:
        parts.append(m["health_note"])
    due = _codes(flags, "IMMUNISATION_DUE")
    verify = _codes(flags, "NEEDS_VERIFICATION")
    if due:
        parts.append("Pending: " + _short(due))
    if any(f["flag_type"] == "HIGH_RISK_ANC" for f in flags):
        parts.append("High-risk pregnancy - refer to PHC")
    if verify:
        parts.append("Verify records: " + _short(verify))
    return " | ".join(parts) or "Normal"


def serialize(conn, h) -> dict:
    members, all_flags, alert = [], [], False
    for m in conn.execute("SELECT * FROM members WHERE household_id=? ORDER BY rowid", (h["id"],)):
        flags = _flags(conn, m["id"])
        if any(f["priority"] == "HIGH" for f in flags) or PENDING_RE.search(m["health_note"] or ""):
            alert = True
        members.append({
            "id": m["id"], "name": m["name"], "age": m["age_years"],
            "relation": m["relation"] or "", "healthStatus": _status_text(m, flags),
            "healthNote": m["health_note"] or "",
        })
        all_flags += [{"member": m["name"], **dict(f)} for f in flags]
    return {
        "id": h["id"], "houseNo": h["house_no"], "houseName": h["house_name"] or h["address"] or "",
        "wardId": h["ward_id"], "members": members, "notes": h["notes"] or "",
        "lastUpdated": (h["updated_at"] or "")[:10], "hasVaccineAlert": alert,
        "taskCompleted": bool(h["task_completed"]), "flags": all_flags,
    }


def get_house(conn, house_no: str) -> dict:
    return serialize(conn, _house_row(conn, house_no))


def list_houses(conn, q: str | None = None) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM households WHERE is_deleted=0 AND house_no IS NOT NULL ORDER BY house_no"
    ).fetchall()
    out = [serialize(conn, r) for r in rows]
    if q:
        ql = q.lower()
        out = [h for h in out if ql in h["houseNo"].lower() or ql in h["houseName"].lower()]
    return out


# ---------------- members ----------------
def _dob_from_age(age: float) -> str:
    return (date.today() - timedelta(days=int(age * 365.25))).isoformat()


def _add_member(conn, hid: str, mem: dict) -> str:
    age, note = mem.get("age"), (mem.get("health_status") or "").strip()
    pregnant = bool(PREG_RE.search(note))
    dob = _dob_from_age(age) if age is not None and age < 5 else None  # approximate, for the rule engine
    mid = db.add_member(conn, hid, mem["name"].strip(), sex="F" if pregnant else mem.get("sex"),
                        dob=dob, age_years=age, relation=mem.get("relation"), is_pregnant=pregnant)
    conn.execute("UPDATE members SET health_note=? WHERE id=?", (note or None, mid))
    if dob:  # no card seen yet -> "not recorded" (needs verification), not "confirmed missed" (BRD)
        age_days = (date.today() - date.fromisoformat(dob)).days
        for code, _n, due, _g, _p in rule_engine.SCHEDULE:
            if age_days >= due:
                conn.execute(
                    "INSERT INTO immunizations(member_id, vaccine_code, status, source_note) VALUES (?,?,?,?)",
                    (mid, code, "NOT_RECORDED", "Registered without card; verify"),
                )
    return mid


def _update_member(conn, row, mem: dict, user: str) -> None:
    note = (mem.get("health_status") or "").strip()
    changes = {"name": mem["name"].strip(), "age_years": mem.get("age"), "relation": mem.get("relation")}
    # The edit form echoes the *displayed* status (note + rule flags); don't save that back as the note.
    if note and note != _status_text(row, _flags(conn, row["id"])):
        changes["health_note"] = note
    for k, v in changes.items():
        if v is not None and row[k] != v:
            conn.execute(f"UPDATE members SET {k}=?, updated_at=datetime('now') WHERE id=?", (v, row["id"]))
            db._audit(conn, "members", row["id"], k, row[k], v, user)
    cur = conn.execute("SELECT * FROM members WHERE id=?", (row["id"],)).fetchone()
    preg = bool(cur["is_pregnant"]) or bool(PREG_RE.search(cur["health_note"] or ""))
    sex = "F" if preg else cur["sex"]
    cat = db.categorise(sex, cur["age_years"], preg)
    if (cat, int(preg), sex) != (cur["category"], cur["is_pregnant"], cur["sex"]):
        conn.execute("UPDATE members SET category=?, is_pregnant=?, sex=? WHERE id=?",
                     (cat, int(preg), sex, row["id"]))


# ---------------- households ----------------
def create_house(conn, p: dict, user: str = "asha") -> dict:
    if conn.execute("SELECT 1 FROM households WHERE house_no=? AND is_deleted=0", (p["house_no"],)).fetchone():
        raise db.DuplicateError(f"House number {p['house_no']} already exists")
    head = p["members"][0]["name"].strip()
    hid = db.create_household(conn, head, p["ward_id"], address=p["house_name"], phone=p.get("phone"))
    try:
        conn.execute(
            "UPDATE households SET house_no=?, house_name=?, password_hash=?, notes=? WHERE id=?",
            (p["house_no"], p["house_name"], hash_password(p["password"]), p.get("notes") or "", hid),
        )
        for mem in p["members"]:
            _add_member(conn, hid, mem)
        rule_engine.run_rules_for_household(conn, hid)
    except Exception:
        conn.execute("DELETE FROM members WHERE household_id=?", (hid,))
        conn.execute("DELETE FROM households WHERE id=?", (hid,))
        raise
    return get_house(conn, p["house_no"])


def update_house(conn, house_no: str, p: dict, user: str = "asha") -> dict:
    h = _house_row(conn, house_no)
    for field, new in (("house_name", p["house_name"]), ("notes", p.get("notes") or "")):
        if h[field] != new:
            db._audit(conn, "households", h["id"], field, h[field], new, user)
    conn.execute(
        "UPDATE households SET house_name=?, address=?, notes=?, updated_at=datetime('now') WHERE id=?",
        (p["house_name"], p["house_name"], p.get("notes") or "", h["id"]),
    )
    if p.get("password"):
        conn.execute("UPDATE households SET password_hash=? WHERE id=?", (hash_password(p["password"]), h["id"]))
    existing = conn.execute("SELECT * FROM members WHERE household_id=? ORDER BY rowid", (h["id"],)).fetchall()
    for i, mem in enumerate(p["members"]):  # matched by position; removing members is not supported here
        if i < len(existing):
            _update_member(conn, existing[i], mem, user)
        else:
            _add_member(conn, h["id"], mem)
    rule_engine.run_rules_for_household(conn, h["id"])
    return get_house(conn, house_no)


def set_task_completed(conn, house_no: str, completed: bool, user: str) -> dict:
    h = _house_row(conn, house_no)
    db._audit(conn, "households", h["id"], "task_completed", h["task_completed"], int(completed), user)
    conn.execute("UPDATE households SET task_completed=?, updated_at=datetime('now') WHERE id=?",
                 (int(completed), h["id"]))
    return get_house(conn, house_no)


def record_vaccine_given(conn, member_id: str, code: str, given_date: str, user: str) -> dict:
    m = conn.execute("SELECT * FROM members WHERE id=?", (member_id,)).fetchone()
    if not m:
        raise db.NotFoundError(f"member {member_id} not found")
    if not conn.execute("SELECT 1 FROM vaccine_schedule WHERE code=?", (code,)).fetchone():
        raise db.ValidationError(f"unknown vaccine code {code}")
    try:
        d = date.fromisoformat(given_date)
    except ValueError as e:
        raise db.ValidationError("given_date must be YYYY-MM-DD") from e
    if d > date.today():
        raise db.ValidationError("vaccination date cannot be in the future")
    db.record_vaccine(conn, member_id, code, given_date, "GIVEN", None, user)
    note = m["health_note"] or ""
    if PENDING_RE.search(note) and code.lower() in note.lower():  # typed "Pending: MR-1" is now stale
        conn.execute("UPDATE members SET health_note=NULL WHERE id=?", (member_id,))
        db._audit(conn, "members", member_id, "health_note", note, None, user)
    rule_engine.run_rules_for_household(conn, m["household_id"])
    h = conn.execute("SELECT * FROM households WHERE id=?", (m["household_id"],)).fetchone()
    return serialize(conn, h)


# ---------------- demo seed ----------------
DEMO = {"Rajan K": ("101", "1234"), "Fathima Beevi": ("102", "5678"), "Suresh P": ("103", "9012")}


def seed_demo(conn) -> None:
    """Give the 3 synthetic households from the DB package house numbers + demo passwords."""
    for head, (no, pw) in DEMO.items():
        conn.execute(
            """UPDATE households SET house_no=?, password_hash=?, house_name=COALESCE(house_name, address)
               WHERE head_name=? AND house_no IS NULL AND is_deleted=0
                 AND NOT EXISTS (SELECT 1 FROM households WHERE house_no=?)""",
            (no, hash_password(pw), head, no),
        )
