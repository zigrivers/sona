"""Tests for samples API endpoints."""

from io import BytesIO
from unittest.mock import patch

import nanoid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.sample import WritingSample


async def _create_clone(session: AsyncSession, name: str = "Test Clone") -> VoiceClone:
    """Helper to create a voice clone for testing."""
    clone = VoiceClone(id=nanoid.generate(), name=name)
    session.add(clone)
    await session.commit()
    return clone


async def _create_sample(
    session: AsyncSession,
    clone_id: str,
    content: str = "Sample text",
    content_type: str = "email",
) -> WritingSample:
    """Helper to create a writing sample for testing."""
    sample = WritingSample(
        id=nanoid.generate(),
        clone_id=clone_id,
        content=content,
        content_type=content_type,
        word_count=len(content.split()),
        length_category="short",
        source_type="paste",
    )
    session.add(sample)
    await session.commit()
    return sample


class TestCreateSamplePaste:
    async def test_create_sample_paste_returns_201(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """POST /api/clones/{id}/samples with paste data should return 201."""
        clone = await _create_clone(session)

        response = await client.post(
            f"/api/clones/{clone.id}/samples",
            json={
                "content": "This is a pasted writing sample for analysis.",
                "content_type": "blog_post",
                "source_type": "paste",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "This is a pasted writing sample for analysis."
        assert data["word_count"] == 8
        assert data["length_category"] == "short"
        assert data["source_type"] == "paste"
        assert "id" in data

    async def test_create_sample_clone_not_found(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/samples for non-existent clone should return 404."""
        response = await client.post(
            "/api/clones/nonexistent/samples",
            json={"content": "Test", "content_type": "email"},
        )
        assert response.status_code == 404


class TestCreateSampleFileUpload:
    async def test_upload_txt_file(self, client: AsyncClient, session: AsyncSession) -> None:
        """POST /api/clones/{id}/samples/upload with .txt file should return 201."""
        clone = await _create_clone(session)

        response = await client.post(
            f"/api/clones/{clone.id}/samples/upload",
            files={"file": ("sample.txt", BytesIO(b"Hello from a text file."), "text/plain")},
            data={"content_type": "email"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "Hello from a text file."
        assert data["source_type"] == "file"
        assert data["source_filename"] == "sample.txt"

    async def test_upload_unsupported_file_type(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """POST /api/clones/{id}/samples/upload with unsupported type should return 422."""
        clone = await _create_clone(session)

        response = await client.post(
            f"/api/clones/{clone.id}/samples/upload",
            files={"file": ("image.png", BytesIO(b"fake png data"), "image/png")},
            data={"content_type": "email"},
        )

        assert response.status_code == 422

    async def test_upload_docx_file(self, client: AsyncClient, session: AsyncSession) -> None:
        """POST /api/clones/{id}/samples/upload with .docx should extract text."""
        clone = await _create_clone(session)

        with patch("app.services.file_parser._parse_docx") as mock_parse:
            mock_parse.return_value = "Extracted docx content."

            response = await client.post(
                f"/api/clones/{clone.id}/samples/upload",
                files={
                    "file": (
                        "doc.docx",
                        BytesIO(b"fake docx"),
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
                data={"content_type": "blog_post"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "Extracted docx content."
        assert data["source_filename"] == "doc.docx"


class TestCreateSampleUrl:
    async def test_create_sample_from_url(
        self,
        client: AsyncClient,
        session: AsyncSession,
        httpx_mock,  # type: ignore[no-untyped-def]
    ) -> None:
        """POST /api/clones/{id}/samples with URL should scrape and create sample."""
        clone = await _create_clone(session)

        html = "<html><body><p>Scraped content from web.</p></body></html>"
        httpx_mock.add_response(url="https://example.com/article", text=html)

        response = await client.post(
            f"/api/clones/{clone.id}/samples/url",
            json={
                "url": "https://example.com/article",
                "content_type": "blog_post",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "Scraped content from web." in data["content"]
        assert data["source_type"] == "url"
        assert data["source_url"] == "https://example.com/article"

    async def test_create_sample_url_scrape_failure(
        self,
        client: AsyncClient,
        session: AsyncSession,
        httpx_mock,  # type: ignore[no-untyped-def]
    ) -> None:
        """POST /api/clones/{id}/samples/url with unreachable URL should return 422."""
        clone = await _create_clone(session)

        httpx_mock.add_response(url="https://unreachable.example.com", status_code=500)

        response = await client.post(
            f"/api/clones/{clone.id}/samples/url",
            json={
                "url": "https://unreachable.example.com",
                "content_type": "blog_post",
            },
        )

        assert response.status_code == 422


class TestListSamples:
    async def test_list_samples(self, client: AsyncClient, session: AsyncSession) -> None:
        """GET /api/clones/{id}/samples should return list of samples."""
        clone = await _create_clone(session)
        await _create_sample(session, clone.id, content="First sample")
        await _create_sample(session, clone.id, content="Second sample")

        response = await client.get(f"/api/clones/{clone.id}/samples")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    async def test_list_samples_empty(self, client: AsyncClient, session: AsyncSession) -> None:
        """GET /api/clones/{id}/samples with no samples should return empty list."""
        clone = await _create_clone(session)

        response = await client.get(f"/api/clones/{clone.id}/samples")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []


class TestDeleteSample:
    async def test_delete_sample(self, client: AsyncClient, session: AsyncSession) -> None:
        """DELETE /api/clones/{id}/samples/{sample_id} should return 204."""
        clone = await _create_clone(session)
        sample = await _create_sample(session, clone.id)

        response = await client.delete(f"/api/clones/{clone.id}/samples/{sample.id}")

        assert response.status_code == 204

    async def test_delete_sample_not_found(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """DELETE /api/clones/{id}/samples/{sample_id} for non-existent should return 404."""
        clone = await _create_clone(session)

        response = await client.delete(f"/api/clones/{clone.id}/samples/nonexistent-id")

        assert response.status_code == 404
