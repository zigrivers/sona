"""Service for database stats, backup, and restore operations."""

import shutil
import sqlite3
from pathlib import Path
from typing import BinaryIO

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.content import Content
from app.models.sample import WritingSample
from app.schemas.data import DatabaseStatsResponse

REQUIRED_TABLES = {"voice_clones", "writing_samples", "content"}


class DataService:
    def __init__(self, session: AsyncSession, db_path: Path) -> None:
        self._session = session
        self._db_path = db_path

    async def get_stats(self) -> DatabaseStatsResponse:
        """Return database file size and record counts."""
        db_size = self._db_path.stat().st_size if self._db_path.exists() else 0

        clone_count = (await self._session.execute(select(func.count(VoiceClone.id)))).scalar_one()
        content_count = (await self._session.execute(select(func.count(Content.id)))).scalar_one()
        sample_count = (
            await self._session.execute(select(func.count(WritingSample.id)))
        ).scalar_one()

        return DatabaseStatsResponse(
            db_location=str(self._db_path),
            db_size_bytes=db_size,
            clone_count=clone_count,
            content_count=content_count,
            sample_count=sample_count,
        )

    def get_db_path(self) -> Path:
        """Return the database file path for backup download."""
        return self._db_path

    def restore(self, uploaded: BinaryIO) -> None:
        """Validate and replace the current database with an uploaded file.

        Creates a .bak of the current database before replacing it.
        Raises ValueError if the uploaded file is not a valid SQLite database
        or is missing required tables.
        """
        # Read uploaded content
        data = uploaded.read()

        # Validate it's a valid SQLite file (magic bytes: first 16 bytes)
        if not data[:16].startswith(b"SQLite format 3"):
            raise ValueError("Uploaded file is not a valid SQLite database")

        # Write to a temp file and validate tables
        tmp_path = self._db_path.with_suffix(".tmp")
        try:
            tmp_path.write_bytes(data)

            conn = sqlite3.connect(str(tmp_path))
            try:
                cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = {row[0] for row in cursor.fetchall()}
            finally:
                conn.close()

            missing = REQUIRED_TABLES - tables
            if missing:
                raise ValueError(
                    f"Database is missing required tables: {', '.join(sorted(missing))}"
                )

            # Back up current database
            if self._db_path.exists():
                shutil.copy2(self._db_path, self._db_path.with_suffix(".db.bak"))

            # Replace with uploaded file
            shutil.move(str(tmp_path), str(self._db_path))
        finally:
            if tmp_path.exists():
                tmp_path.unlink()
