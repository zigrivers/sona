"""Tests for content import API endpoints."""

from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock

import nanoid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_llm_provider
from app.main import app
from app.models.clone import VoiceClone


async def _create_clone(session: AsyncSession) -> VoiceClone:
    """Create a clone for testing."""
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.commit()
    return clone


@pytest.fixture
def mock_provider() -> AsyncMock:
    provider = AsyncMock()
    provider.complete = AsyncMock(return_value="Generated content.")
    return provider


@pytest.fixture(autouse=True)
def override_llm_provider(mock_provider: AsyncMock) -> AsyncGenerator[None]:
    async def _override() -> Any:
        return mock_provider

    app.dependency_overrides[get_llm_provider] = _override
    yield
    app.dependency_overrides.pop(get_llm_provider, None)


class TestImportPasteEndpoint:
    async def test_import_paste_creates_content(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/import should return 201 with imported content."""
        clone = await _create_clone(session)

        response = await client.post(
            "/api/content/import",
            json={
                "clone_id": clone.id,
                "platform": "blog",
                "content_text": "My imported blog post content.",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
        assert data["content_current"] == "My imported blog post content."
        assert data["generation_properties"] == {"source": "import"}
        assert data["input_text"] == "[Imported]"

    async def test_import_paste_empty_text_rejected(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/import with empty text should return 422."""
        clone = await _create_clone(session)

        response = await client.post(
            "/api/content/import",
            json={
                "clone_id": clone.id,
                "platform": "blog",
                "content_text": "",
            },
        )

        assert response.status_code == 422

    async def test_import_paste_clone_not_found(
        self,
        client: AsyncClient,
    ) -> None:
        """POST /api/content/import with nonexistent clone should return 404."""
        response = await client.post(
            "/api/content/import",
            json={
                "clone_id": "nonexistent-id",
                "platform": "blog",
                "content_text": "Some text.",
            },
        )

        assert response.status_code == 404


class TestImportFileUploadEndpoint:
    async def test_import_file_upload_creates_content(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/import/upload with .txt should return 201."""
        clone = await _create_clone(session)

        response = await client.post(
            "/api/content/import/upload",
            data={"clone_id": clone.id, "platform": "blog"},
            files={"file": ("test.txt", b"My uploaded content.", "text/plain")},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
        assert data["content_current"] == "My uploaded content."
        assert data["generation_properties"] == {"source": "import"}

    async def test_import_file_unsupported_type_rejected(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/import/upload with unsupported file should return 422."""
        clone = await _create_clone(session)

        response = await client.post(
            "/api/content/import/upload",
            data={"clone_id": clone.id, "platform": "blog"},
            files={"file": ("test.html", b"<html></html>", "text/html")},
        )

        assert response.status_code == 422
