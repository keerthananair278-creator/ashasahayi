"""SQLite connection + lightweight migrations for the ASHA-Sahayi backend."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

from . import db_core as db
from . import models, rule_engine

HERE = Path(__file__).parent
DB_PATH = Path(os.getenv("DB_PATH", HERE / "asha_sahayi.db"))

# Columns the web frontend needs on top of the base schema.
MIGRATIONS = {
    "households": [
        ("house_no", "TEXT"),
        ("house_name", "TEXT"),
        ("password_hash", "TEXT"),
        ("notes", "TEXT"),
        ("task_completed", "INTEGER NOT NULL DEFAULT 0"),
    ],
    "members": [("health_note", "TEXT")],
}


def _columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {r["name"] for r in conn.execute(f"PRAGMA table_info({table})")}


def init_db() -> None:
    conn = db.connect(DB_PATH)
    try:
        has_tables = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='households'"
        ).fetchone()
        if not has_tables:  # fresh DB: create schema (knowledge base will be empty)
            db.init_schema(conn)
        rule_engine.seed_schedule(conn)
        for table, cols in MIGRATIONS.items():
            existing = _columns(conn, table)
            for name, ddl in cols:
                if name not in existing:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS ux_households_house_no "
            "ON households(house_no) WHERE house_no IS NOT NULL"
        )
        if os.getenv("SEED_DEMO", "1") == "1":
            models.seed_demo(conn)
    finally:
        conn.close()


def get_conn():
    """FastAPI dependency: one connection per request."""
    conn = db.connect(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()
