"""
db/sqlite_mgr.py

Encapsulates all SQLite I/O behind a SQLiteManager class.
Each public method opens and closes its own connection so the manager
is safe to share across async request handlers without holding a
long-lived connection.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from src.core.logger import get_logger

logger = get_logger(__name__)

# SQL statements isolated here for easy auditing / future migration
_CREATE_CANDIDATES_TABLE = """
    CREATE TABLE IF NOT EXISTS candidates (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT    UNIQUE NOT NULL,
        name     TEXT    NOT NULL,
        role     TEXT,
        email    TEXT,
        phone    TEXT,
        content  TEXT    NOT NULL
    )
"""

_UPSERT_CANDIDATE = """
    INSERT OR REPLACE INTO candidates (filename, name, role, email, phone, content)
    VALUES (?, ?, ?, ?, ?, ?)
"""

_SELECT_ALL_CANDIDATES = """
    SELECT id, filename, name, role, email, phone, content
    FROM candidates
"""

_SELECT_CANDIDATE_BY_NAME = """
    SELECT id, filename, name, role, email, phone, content
    FROM candidates
    WHERE name = ?
    LIMIT 1
"""


class SQLiteManager:
    """Lightweight wrapper around sqlite3 with context-managed connections."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def _connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Open a connection, yield it, then close it — always."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Schema management
    # ------------------------------------------------------------------

    def setup_database(self) -> None:
        """Create tables if they do not already exist."""
        with self._connection() as conn:
            conn.execute(_CREATE_CANDIDATES_TABLE)
            conn.commit()
        logger.info("SQLite schema verified / created at %s", self.db_path)

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def upsert_candidate(
        self,
        filename: str,
        name: str,
        role: str | None,
        email: str | None,
        phone: str | None,
        content: str,
    ) -> None:
        """Insert or replace a candidate row (keyed on filename)."""
        with self._connection() as conn:
            conn.execute(_UPSERT_CANDIDATE, (filename, name, role, email, phone, content))
            conn.commit()
        logger.info("Upserted candidate: %s (%s)", name, filename)

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all_candidates(self) -> list[dict]:
        """Return every candidate row as a plain dict."""
        with self._connection() as conn:
            rows = conn.execute(_SELECT_ALL_CANDIDATES).fetchall()
        candidates = [dict(row) for row in rows]
        logger.info("Fetched %d candidates from SQLite.", len(candidates))
        return candidates

    def get_candidate_by_name(self, name: str) -> dict | None:
        """Return a single candidate row by name, or None if not found."""
        with self._connection() as conn:
            row = conn.execute(_SELECT_CANDIDATE_BY_NAME, (name,)).fetchone()
        return dict(row) if row else None
