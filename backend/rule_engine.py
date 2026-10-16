"""Deterministic follow-up rules. AI never decides these (BRD section 3).

Schedule taken from the MCP Card 2018 (pages 36-38). Demo rule set — must be
clinically validated before real use.
"""
from __future__ import annotations

from datetime import date, timedelta

RULE_VERSION = "demo-rules-v1"

# code, vaccine, due age (days), grace (days), prevents
SCHEDULE = [
    ("BCG", "BCG", 0, 365, "Tuberculosis"),
    ("OPV-0", "OPV", 0, 15, "Polio"),
    ("HepB-0", "Hepatitis B birth dose", 0, 1, "Liver disease"),
    ("OPV-1", "OPV", 42, 28, "Polio"),
    ("Penta-1", "Pentavalent", 42, 28, "Diphtheria, pertussis, tetanus, HepB, Hib"),
    ("Rota-1", "Rotavirus", 42, 28, "Diarrhoea"),
    ("PCV-1", "PCV", 42, 28, "Pneumonia"),
    ("IPV-1", "fIPV", 42, 28, "Polio"),
    ("OPV-2", "OPV", 70, 28, "Polio"),
    ("Penta-2", "Pentavalent", 70, 28, "Diphtheria, pertussis, tetanus, HepB, Hib"),
    ("Rota-2", "Rotavirus", 70, 28, "Diarrhoea"),
    ("OPV-3", "OPV", 98, 28, "Polio"),
    ("Penta-3", "Pentavalent", 98, 28, "Diphtheria, pertussis, tetanus, HepB, Hib"),
    ("Rota-3", "Rotavirus", 98, 28, "Diarrhoea"),
    ("PCV-2", "PCV", 98, 28, "Pneumonia"),
    ("IPV-2", "fIPV", 98, 28, "Polio"),
    ("MR-1", "Measles-Rubella", 270, 90, "Measles, rubella"),
    ("JE-1", "Japanese Encephalitis", 270, 90, "Brain fever"),
    ("PCV-B", "PCV booster", 270, 90, "Pneumonia"),
    ("VitA-1", "Vitamin A", 270, 90, "Vitamin A deficiency"),
    ("DPT-B1", "DPT booster 1", 480, 240, "Diphtheria, pertussis, tetanus"),
    ("MR-2", "Measles-Rubella", 480, 240, "Measles, rubella"),
    ("JE-2", "Japanese Encephalitis", 480, 240, "Brain fever"),
    ("OPV-B", "OPV booster", 480, 240, "Polio"),
    ("VitA-2", "Vitamin A", 480, 90, "Vitamin A deficiency"),
    ("DPT-B2", "DPT booster 2", 1825, 365, "Diphtheria, pertussis, tetanus"),
]


def seed_schedule(conn) -> None:
    conn.executemany(
        "INSERT OR REPLACE INTO vaccine_schedule(code, vaccine, due_age_days, grace_days, prevents, rule_version) VALUES (?,?,?,?,?,?)",
        [(*row, RULE_VERSION) for row in SCHEDULE],
    )


def evaluate_child(dob: str, records: list[dict], today: date | None = None) -> dict:
    """records: [{'vaccine_code','given_date','status'}]. Returns status + flags."""
    today = today or date.today()
    birth = date.fromisoformat(dob)
    age_days = (today - birth).days
    by_code: dict[str, list] = {}
    for r in records:
        by_code.setdefault(r["vaccine_code"], []).append(r)

    flags = []
    for code, name, due, grace, _ in SCHEDULE:
        if age_days < due:
            continue
        recs = by_code.get(code, [])
        given = [r for r in recs if r.get("status") == "GIVEN" and r.get("given_date")]
        dates = {r["given_date"] for r in given}

        # TC-24: conflicting or impossible dates -> needs verification
        if len(dates) > 1 or any(date.fromisoformat(d) < birth or date.fromisoformat(d) > today for d in dates):
            flags.append(dict(flag_type="NEEDS_VERIFICATION", priority="MEDIUM", code=code, due_date=None,
                              reason=f"{code}: conflicting or invalid vaccination dates {sorted(dates)}"))
            continue
        if given:
            continue
        deadline = birth + timedelta(days=due + grace)
        if any(r.get("status") == "NOT_RECORDED" for r in recs):
            # BRD: missing documentation is NOT a confirmed missed dose
            flags.append(dict(flag_type="NEEDS_VERIFICATION", priority="MEDIUM", code=code,
                              due_date=deadline.isoformat(),
                              reason=f"{code} ({name}) not recorded on card — verify with ANM / MCP card"))
        elif age_days > due + grace:
            flags.append(dict(flag_type="IMMUNISATION_DUE", priority="HIGH", code=code,
                              due_date=deadline.isoformat(),
                              reason=f"{code} ({name}) due at {due} days; child is {age_days} days old. "
                                     f"Possible gap — catch-up recommended (compliance deadline {deadline})"))
        else:
            flags.append(dict(flag_type="IMMUNISATION_DUE", priority="LOW", code=code,
                              due_date=deadline.isoformat(),
                              reason=f"{code} ({name}) is due now; give before {deadline}"))

    urgent = any(f["priority"] in ("HIGH", "MEDIUM") for f in flags)
    return {"status": "COMPLIANT" if not flags else ("NEEDS_FOLLOWUP" if urgent else "DUE_SOON"),
            "flags": flags, "rule_version": RULE_VERSION, "age_days": age_days}


HIGH_RISK_TERMS = ("hypertension", "high bp", "bp high", "headache and blurred", "convulsion", "bleeding",
                   "swelling of face", "pre-eclampsia", "severe anaemia", "രക്തസ്രാവം", "ഉയർന്ന രക്തസമ്മർദ്ദം")


def evaluate_anc(notes: str = "", bp_systolic: int | None = None, bp_diastolic: int | None = None,
                 hb: float | None = None) -> list[dict]:
    """TC-25. Danger signs per MCP card ANC page."""
    flags = []
    text = (notes or "").lower()
    if (bp_systolic and bp_systolic >= 140) or (bp_diastolic and bp_diastolic >= 90) or any(t in text for t in HIGH_RISK_TERMS):
        flags.append(dict(flag_type="HIGH_RISK_ANC", priority="HIGH", code=None, due_date=None,
                          reason="Possible hypertension / danger sign in pregnancy — refer to PHC immediately"))
    if hb is not None and hb < 7:
        flags.append(dict(flag_type="HIGH_RISK_ANC", priority="HIGH", code=None, due_date=None,
                          reason=f"Severe anaemia (Hb {hb} g/dL) — refer to PHC"))
    return flags


def overdue_followups(conn, today: date | None = None, days: int = 3) -> list:
    """TC-28: follow-ups whose due date passed by >= `days` days."""
    cutoff = ((today or date.today()) - timedelta(days=days)).isoformat()
    return conn.execute(
        "SELECT * FROM followup_flags WHERE resolved=0 AND due_date IS NOT NULL AND due_date <= ?", (cutoff,)
    ).fetchall()


def run_rules_for_household(conn, hid: str, today: date | None = None) -> list[dict]:
    """Evaluate every member, store flags, return them."""
    out = []
    conn.execute("DELETE FROM followup_flags WHERE resolved=0 AND member_id IN (SELECT id FROM members WHERE household_id=?)", (hid,))
    for m in conn.execute("SELECT * FROM members WHERE household_id=?", (hid,)).fetchall():
        flags = []
        if m["category"] == "CHILD" and m["dob"]:
            recs = [dict(r) for r in conn.execute(
                "SELECT vaccine_code, given_date, status FROM immunizations WHERE member_id=?", (m["id"],))]
            flags = evaluate_child(m["dob"], recs, today)["flags"]
        elif m["category"] == "ANC":
            v = conn.execute("SELECT * FROM anc_visits WHERE member_id=? ORDER BY visit_date DESC LIMIT 1", (m["id"],)).fetchone()
            if v:
                flags = evaluate_anc(v["notes"], v["bp_systolic"], v["bp_diastolic"], v["hb_g_dl"])
                if flags:
                    conn.execute("UPDATE members SET high_risk=1 WHERE id=?", (m["id"],))
        for f in flags:
            conn.execute(
                "INSERT INTO followup_flags(member_id, flag_type, priority, reason, due_date, rule_version) VALUES (?,?,?,?,?,?)",
                (m["id"], f["flag_type"], f["priority"], f["reason"], f["due_date"], RULE_VERSION),
            )
            out.append({"member": m["name"], **f})
    return out
