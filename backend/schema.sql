-- ASHA-Sahayi database schema (SQLite). Synthetic data only.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS households (
    id          TEXT PRIMARY KEY,                -- UUID
    head_name   TEXT NOT NULL CHECK (length(trim(head_name)) > 0),
    ward_id     TEXT NOT NULL CHECK (length(trim(ward_id)) > 0),
    address     TEXT,
    phone       TEXT,
    latitude    REAL CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    longitude   REAL CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (ward_id, head_name, phone)          -- TC-03 duplicate detection
);

CREATE TABLE IF NOT EXISTS members (
    id            TEXT PRIMARY KEY,
    household_id  TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,  -- TC-09/TC-13
    name          TEXT NOT NULL,
    name_ml       TEXT,                         -- Malayalam name
    sex           TEXT CHECK (sex IN ('M','F','O')),
    dob           TEXT,                         -- ISO date
    age_years     REAL CHECK (age_years IS NULL OR age_years BETWEEN 0 AND 120),  -- TC-05
    relation      TEXT,
    phone         TEXT,
    is_pregnant   INTEGER NOT NULL DEFAULT 0,
    lmp_date      TEXT,
    edd_date      TEXT,
    high_risk     INTEGER NOT NULL DEFAULT 0,
    category      TEXT,                         -- ANC / CHILD / GENERAL (TC-06)
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_members_household ON members(household_id);

-- Reference schedule from the MCP card (National Immunization Schedule).
CREATE TABLE IF NOT EXISTS vaccine_schedule (
    code            TEXT PRIMARY KEY,           -- e.g. MR-1
    vaccine         TEXT NOT NULL,
    due_age_days    INTEGER NOT NULL,           -- recommended age
    grace_days      INTEGER NOT NULL,           -- after due + grace -> follow-up flag
    prevents        TEXT,
    source          TEXT NOT NULL DEFAULT 'MCP Card 2018, p.36-38',
    rule_version    TEXT NOT NULL DEFAULT 'demo-rules-v1'
);

CREATE TABLE IF NOT EXISTS immunizations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    vaccine_code  TEXT NOT NULL REFERENCES vaccine_schedule(code),
    given_date    TEXT,                         -- NULL = not recorded
    status        TEXT NOT NULL DEFAULT 'GIVEN' CHECK (status IN ('GIVEN','NOT_RECORDED','MISSED_CONFIRMED')),
    source_note   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS anc_visits (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    visit_date    TEXT NOT NULL,
    weight_kg     REAL,
    bp_systolic   INTEGER,
    bp_diastolic  INTEGER,
    hb_g_dl       REAL,
    notes         TEXT
);

CREATE TABLE IF NOT EXISTS visit_notes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id  TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    member_id     TEXT REFERENCES members(id) ON DELETE SET NULL,
    visit_date    TEXT NOT NULL,
    language      TEXT NOT NULL DEFAULT 'en',   -- en / ml / hi
    raw_text      TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS followup_flags (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    flag_type     TEXT NOT NULL,                -- IMMUNISATION_DUE / NEEDS_VERIFICATION / HIGH_RISK_ANC / OVERDUE_FOLLOWUP
    priority      TEXT NOT NULL CHECK (priority IN ('LOW','MEDIUM','HIGH')),
    reason        TEXT NOT NULL,
    due_date      TEXT,
    rule_version  TEXT NOT NULL,
    resolved      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_summaries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id  TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    model         TEXT NOT NULL,
    summary_json  TEXT NOT NULL,
    is_fallback   INTEGER NOT NULL DEFAULT 0,
    reviewed      INTEGER NOT NULL DEFAULT 0,   -- human review before save (BRD)
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Knowledge base for retrieval-augmented generation (RAG) with Groq.
CREATE TABLE IF NOT EXISTS documents (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    filename  TEXT NOT NULL UNIQUE,
    title     TEXT,
    doc_type  TEXT,                             -- guideline / card / brd / test_spec
    pages     INTEGER
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page        INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    content     TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    content, content='knowledge_chunks', content_rowid='id', tokenize='porter unicode61'
);
CREATE TRIGGER IF NOT EXISTS kc_ai AFTER INSERT ON knowledge_chunks BEGIN
    INSERT INTO knowledge_fts(rowid, content) VALUES (new.id, new.content);
END;
CREATE TRIGGER IF NOT EXISTS kc_ad AFTER DELETE ON knowledge_chunks BEGIN
    INSERT INTO knowledge_fts(knowledge_fts, rowid, content) VALUES ('delete', old.id, old.content);
END;

-- Immutable audit log (TC-07, TC-35)
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name  TEXT NOT NULL,
    record_id   TEXT NOT NULL,
    field       TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_by  TEXT NOT NULL,
    changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is immutable'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is immutable'); END;
