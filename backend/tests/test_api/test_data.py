"""Tests for data stats, backup, and restore API endpoints."""

import sqlite3
from collections.abc import Generator
from pathlib import Path

import nanoid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.clone import VoiceClone
from app.models.content import Content
from app.models.sample import WritingSample


def _make_sqlite_db(path: Path, tables: list[str] | None = None) -> bytes:
    """Create a SQLite file with the given tables and return its bytes."""
    if tables is None:
        tables = [
            "CREATE TABLE voice_clones (id TEXT PRIMARY KEY, name TEXT)",
            "CREATE TABLE writing_samples (id TEXT PRIMARY KEY, clone_id TEXT)",
            "CREATE TABLE content (id TEXT PRIMARY KEY, clone_id TEXT)",
        ]
    conn = sqlite3.connect(str(path))
    for ddl in tables:
        conn.execute(ddl)
    conn.commit()
    conn.close()
    return path.read_bytes()


@pytest.fixture
def tmp_db(tmp_path: Path) -> Path:
    """Create a real SQLite database file for backup/restore tests."""
    db_file = tmp_path / "test.db"
    _make_sqlite_db(db_file)
    return db_file


@pytest.fixture(autouse=True)
def override_db_path(tmp_db: Path) -> Generator[None]:
    """Override the get_db_path dependency to point at the tmp_path file."""
    from app.api.data import get_db_path

    app.dependency_overrides[get_db_path] = lambda: tmp_db
    yield
    app.dependency_overrides.pop(get_db_path, None)


async def _create_clone(session: AsyncSession, name: str = "Test Clone") -> VoiceClone:
    clone = VoiceClone(id=nanoid.generate(), name=name)
    session.add(clone)
    await session.commit()
    return clone


async def _create_sample(session: AsyncSession, clone_id: str) -> WritingSample:
    sample = WritingSample(
        id=nanoid.generate(),
        clone_id=clone_id,
        content="Sample text for testing.",
        content_type="blog_post",
        word_count=4,
        source_type="paste",
    )
    session.add(sample)
    await session.commit()
    return sample


async def _create_content(session: AsyncSession, clone_id: str) -> Content:
    content = Content(
        id=nanoid.generate(),
        clone_id=clone_id,
        platform="twitter",
        status="draft",
        content_current="Hello world",
        content_original="Hello world",
        input_text="Write a tweet",
        word_count=2,
        char_count=11,
    )
    session.add(content)
    await session.commit()
    return content


class TestGetStats:
    async def test_returns_200_with_all_fields(self, client: AsyncClient) -> None:
        response = await client.get("/api/data/stats")
        assert response.status_code == 200
        data = response.json()
        assert "db_location" in data
        assert "db_size_bytes" in data
        assert "clone_count" in data
        assert "content_count" in data
        assert "sample_count" in data

    async def test_returns_correct_counts(self, client: AsyncClient, session: AsyncSession) -> None:
        clone = await _create_clone(session)
        await _create_sample(session, clone.id)
        await _create_sample(session, clone.id)
        await _create_content(session, clone.id)

        response = await client.get("/api/data/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["clone_count"] == 1
        assert data["sample_count"] == 2
        assert data["content_count"] == 1

    async def test_returns_zero_counts_when_empty(self, client: AsyncClient) -> None:
        response = await client.get("/api/data/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["clone_count"] == 0
        assert data["sample_count"] == 0
        assert data["content_count"] == 0


class TestBackupDatabase:
    async def test_returns_file_download(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get("/api/data/backup")
        assert response.status_code == 200
        assert "application/octet-stream" in response.headers["content-type"]
        assert "sona-backup.db" in response.headers.get("content-disposition", "")

    async def test_backup_content_matches_db(self, client: AsyncClient, tmp_db: Path) -> None:
        # Read original bytes synchronously before the async call via fixture
        original = _read_bytes(tmp_db)
        response = await client.get("/api/data/backup")
        assert response.content == original


def _read_bytes(path: Path) -> bytes:
    return path.read_bytes()


def _build_upload_db(tmp_dir: Path, filename: str = "upload.db") -> bytes:
    """Build a valid SQLite upload file and return its bytes."""
    upload_path = tmp_dir / filename
    _make_sqlite_db(upload_path)
    return upload_path.read_bytes()


def _build_incomplete_db(tmp_dir: Path) -> bytes:
    """Build a SQLite file missing required tables."""
    upload_path = tmp_dir / "incomplete.db"
    _make_sqlite_db(
        upload_path,
        tables=["CREATE TABLE voice_clones (id TEXT PRIMARY KEY)"],
    )
    return upload_path.read_bytes()


class TestRestoreDatabase:
    async def test_accepts_valid_sqlite_file(self, client: AsyncClient, tmp_db: Path) -> None:
        upload_bytes = _build_upload_db(tmp_db.parent)

        response = await client.post(
            "/api/data/restore",
            files={"file": ("backup.db", upload_bytes, "application/octet-stream")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    async def test_rejects_non_sqlite_file(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/data/restore",
            files={"file": ("bad.txt", b"not a database", "application/octet-stream")},
        )
        assert response.status_code == 400

    async def test_creates_bak_before_replacing(self, client: AsyncClient, tmp_db: Path) -> None:
        original_content = _read_bytes(tmp_db)
        upload_bytes = _build_upload_db(tmp_db.parent)

        response = await client.post(
            "/api/data/restore",
            files={"file": ("backup.db", upload_bytes, "application/octet-stream")},
        )
        assert response.status_code == 200

        bak_path = tmp_db.with_suffix(".db.bak")
        assert _path_exists(bak_path)
        assert _read_bytes(bak_path) == original_content

    async def test_rejects_sqlite_missing_tables(self, client: AsyncClient, tmp_db: Path) -> None:
        upload_bytes = _build_incomplete_db(tmp_db.parent)

        response = await client.post(
            "/api/data/restore",
            files={"file": ("incomplete.db", upload_bytes, "application/octet-stream")},
        )
        assert response.status_code == 400


def _path_exists(path: Path) -> bool:
    return path.exists()
