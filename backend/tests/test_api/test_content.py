"""Tests for content generation API endpoints."""

import json
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
from app.models.content import Content
from app.models.dna import VoiceDNAVersion


async def _create_clone_with_dna(
    session: AsyncSession,
) -> VoiceClone:
    """Create a clone with voice DNA for testing."""
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.flush()

    dna = VoiceDNAVersion(
        id=nanoid.generate(),
        clone_id=clone.id,
        version_number=1,
        data={"tone": "casual", "humor": "dry"},
        trigger="initial_analysis",
        model_used="test-model",
    )
    session.add(dna)
    await session.commit()
    return clone


@pytest.fixture
def mock_provider() -> AsyncMock:
    """Create a mock LLM provider."""
    provider = AsyncMock()
    provider.complete = AsyncMock(return_value="Generated content here.")
    return provider


@pytest.fixture(autouse=True)
def override_llm_provider(mock_provider: AsyncMock) -> AsyncGenerator[None]:
    """Override the LLM provider dependency for all tests in this module."""

    async def _override() -> Any:
        return mock_provider

    app.dependency_overrides[get_llm_provider] = _override
    yield
    app.dependency_overrides.pop(get_llm_provider, None)


class TestGenerateEndpoint:
    async def test_generate_returns_201(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/generate should return 201 with generated content."""
        clone = await _create_clone_with_dna(session)
        mock_provider.complete = AsyncMock(return_value="Generated blog content here.")

        response = await client.post(
            "/api/content/generate",
            json={
                "clone_id": clone.id,
                "platforms": ["blog"],
                "input_text": "Write about testing.",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["platform"] == "blog"
        assert data["items"][0]["content_current"] == "Generated blog content here."
        assert data["items"][0]["status"] == "draft"
        assert data["items"][0]["word_count"] == 4
        assert data["items"][0]["char_count"] == len("Generated blog content here.")

    async def test_generate_multiple_platforms(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/generate with multiple platforms should return all."""
        clone = await _create_clone_with_dna(session)
        mock_provider.complete = AsyncMock(return_value="Platform content.")

        response = await client.post(
            "/api/content/generate",
            json={
                "clone_id": clone.id,
                "platforms": ["twitter", "linkedin"],
                "input_text": "Write about AI.",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 2
        platforms = {item["platform"] for item in data["items"]}
        assert platforms == {"twitter", "linkedin"}

    async def test_generate_without_dna_returns_400(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """POST /api/content/generate for clone without DNA should return 400."""
        clone = VoiceClone(id=nanoid.generate(), name="No DNA Clone")
        session.add(clone)
        await session.commit()

        response = await client.post(
            "/api/content/generate",
            json={
                "clone_id": clone.id,
                "platforms": ["blog"],
                "input_text": "Write something.",
            },
        )

        assert response.status_code == 400
        assert "DNA" in response.json()["detail"]

    async def test_generate_clone_not_found(self, client: AsyncClient) -> None:
        """POST /api/content/generate for non-existent clone should return 404."""
        response = await client.post(
            "/api/content/generate",
            json={
                "clone_id": "nonexistent-id",
                "platforms": ["blog"],
                "input_text": "Write something.",
            },
        )

        assert response.status_code == 404

    async def test_generate_with_properties(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/generate with properties should pass them through."""
        clone = await _create_clone_with_dna(session)
        mock_provider.complete = AsyncMock(return_value="Formal content.")

        response = await client.post(
            "/api/content/generate",
            json={
                "clone_id": clone.id,
                "platforms": ["email"],
                "input_text": "Write an email.",
                "properties": {"tone": "formal"},
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["items"][0]["generation_properties"] == {"tone": "formal"}


class TestStreamEndpoint:
    async def test_stream_returns_sse(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/generate/stream should return SSE events."""
        clone = await _create_clone_with_dna(session)

        async def mock_stream(messages: list[dict[str, str]], **kwargs: Any) -> Any:
            for chunk in ["Hello ", "world ", "streaming."]:
                yield chunk

        mock_provider.stream = mock_stream

        response = await client.post(
            "/api/content/generate/stream",
            json={
                "clone_id": clone.id,
                "platform": "blog",
                "input_text": "Write a blog post.",
            },
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        body = response.text
        assert "Hello " in body
        assert "streaming." in body


async def _generate_one(
    client: AsyncClient, session: AsyncSession, mock_provider: AsyncMock
) -> dict[str, Any]:
    """Generate a single content item and return its JSON dict."""
    clone = await _create_clone_with_dna(session)
    mock_provider.complete = AsyncMock(return_value="Generated content here.")
    response = await client.post(
        "/api/content/generate",
        json={
            "clone_id": clone.id,
            "platforms": ["blog"],
            "input_text": "Write about testing.",
        },
    )
    assert response.status_code == 201
    return response.json()["items"][0]


class TestContentCRUDEndpoints:
    async def test_get_content_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """GET /api/content/{id} should return the content."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.get(f"/api/content/{item['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == item["id"]
        assert data["content_current"] == "Generated content here."

    async def test_get_content_404(self, client: AsyncClient) -> None:
        """GET /api/content/{id} for missing content should return 404."""
        response = await client.get("/api/content/nonexistent-id")
        assert response.status_code == 404

    async def test_update_content_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """PUT /api/content/{id} with content_current should update and return 200."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.put(
            f"/api/content/{item['id']}",
            json={"content_current": "Updated text."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["content_current"] == "Updated text."
        assert data["word_count"] == 2

    async def test_update_status_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """PUT /api/content/{id} with status should update status."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.put(
            f"/api/content/{item['id']}",
            json={"status": "review"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "review"

    async def test_delete_content_204(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """DELETE /api/content/{id} should return 204."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.delete(f"/api/content/{item['id']}")
        assert response.status_code == 204

        # Verify gone
        response = await client.get(f"/api/content/{item['id']}")
        assert response.status_code == 404

    async def test_delete_content_404(self, client: AsyncClient) -> None:
        """DELETE /api/content/{id} for missing content should return 404."""
        response = await client.delete("/api/content/nonexistent-id")
        assert response.status_code == 404


class TestContentVersionEndpoints:
    async def test_list_versions_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """GET /api/content/{id}/versions should return version list."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.get(f"/api/content/{item['id']}/versions")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert data["items"][0]["trigger"] == "generation"

    async def test_restore_version_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/restore/{version} should restore and return 200."""
        item = await _generate_one(client, session, mock_provider)

        # Edit first
        await client.put(
            f"/api/content/{item['id']}",
            json={"content_current": "Edited text."},
        )

        # Restore to version 1
        response = await client.post(f"/api/content/{item['id']}/restore/1")
        assert response.status_code == 200
        data = response.json()
        assert data["content_current"] == "Generated content here."

    async def test_restore_nonexistent_version_400(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/restore/{version} with bad version should return 400."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.post(f"/api/content/{item['id']}/restore/999")
        assert response.status_code == 400


async def _create_content_row(
    session: AsyncSession,
    clone: VoiceClone,
    *,
    platform: str = "blog",
    status: str = "draft",
    content_text: str = "Default content.",
    authenticity_score: int | None = None,
    tags: list[str] | None = None,
) -> Content:
    """Create a Content row directly for filter/list API tests."""
    from app.models.content import Content as ContentModel

    content = ContentModel(
        clone_id=clone.id,
        platform=platform,
        status=status,
        content_current=content_text,
        content_original=content_text,
        input_text="test input",
        authenticity_score=authenticity_score,
        tags=tags or [],
        word_count=len(content_text.split()),
        char_count=len(content_text),
    )
    session.add(content)
    await session.commit()
    return content


class TestListEndpoint:
    async def test_list_content_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content should return paginated list."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, content_text="First")
        await _create_content_row(session, clone, content_text="Second")

        response = await client.get("/api/content")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    async def test_list_filter_by_clone(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content?clone_id=X should filter by clone."""
        clone_a = await _create_clone_with_dna(session)
        clone_b = VoiceClone(name="Clone B")
        session.add(clone_b)
        await session.flush()
        dna_b = VoiceDNAVersion(
            clone_id=clone_b.id,
            version_number=1,
            data={"tone": "formal"},
            trigger="initial_analysis",
            model_used="test",
        )
        session.add(dna_b)
        await session.commit()

        await _create_content_row(session, clone_a, content_text="A content")
        await _create_content_row(session, clone_b, content_text="B content")

        response = await client.get(f"/api/content?clone_id={clone_a.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["clone_id"] == clone_a.id

    async def test_list_filter_by_platform(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content?platform=linkedin should filter by platform."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, platform="linkedin")
        await _create_content_row(session, clone, platform="twitter")

        response = await client.get("/api/content?platform=linkedin")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["platform"] == "linkedin"

    async def test_list_filter_by_status(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content?status=draft should filter by status."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, status="draft")
        await _create_content_row(session, clone, status="published")

        response = await client.get("/api/content?status=draft")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["status"] == "draft"

    async def test_list_search(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content?search=keyword should search content_current."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, content_text="Machine learning rocks")
        await _create_content_row(session, clone, content_text="Cooking tips")

        response = await client.get("/api/content?search=machine")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

    async def test_list_sort_by_score(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content?sort=authenticity_score&order=desc should sort by score."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, authenticity_score=50)
        await _create_content_row(session, clone, authenticity_score=90)

        response = await client.get("/api/content?sort=authenticity_score&order=desc")
        assert response.status_code == 200
        data = response.json()
        scores = [item["authenticity_score"] for item in data["items"]]
        assert scores == [90, 50]

    async def test_list_combined_filters(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """GET /api/content with multiple filters uses AND logic."""
        clone = await _create_clone_with_dna(session)
        await _create_content_row(session, clone, platform="linkedin", status="draft")
        await _create_content_row(session, clone, platform="linkedin", status="published")
        await _create_content_row(session, clone, platform="twitter", status="draft")

        response = await client.get("/api/content?platform=linkedin&status=draft")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1


class TestBulkEndpoints:
    async def test_bulk_status_update(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/bulk/status should update status for given ids."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_row(session, clone, status="draft")
        c2 = await _create_content_row(session, clone, status="draft")

        response = await client.post(
            "/api/content/bulk/status",
            json={"ids": [c1.id, c2.id], "status": "review"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2

    async def test_bulk_delete(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/bulk/delete should delete specified content items."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_row(session, clone)
        c2 = await _create_content_row(session, clone)

        response = await client.post(
            "/api/content/bulk/delete",
            json={"ids": [c1.id, c2.id]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2

        # Verify deleted
        response = await client.get(f"/api/content/{c1.id}")
        assert response.status_code == 404

    async def test_bulk_tag_add(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/bulk/tag should add tags to specified content items."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_row(session, clone, tags=["existing"])
        c2 = await _create_content_row(session, clone)

        response = await client.post(
            "/api/content/bulk/tag",
            json={"ids": [c1.id, c2.id], "tags": ["new-tag"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2


def _make_score_response() -> str:
    """Build a fake LLM JSON response for scoring."""
    dims = [
        {"name": "vocabulary_match", "score": 85, "feedback": "Good match"},
        {"name": "sentence_flow", "score": 90, "feedback": "Strong flow"},
        {"name": "structural_rhythm", "score": 78, "feedback": "Decent rhythm"},
        {"name": "tone_fidelity", "score": 92, "feedback": "Excellent tone"},
        {"name": "rhetorical_fingerprint", "score": 88, "feedback": "Good rhetoric"},
        {"name": "punctuation_signature", "score": 75, "feedback": "Acceptable"},
        {"name": "hook_and_close", "score": 80, "feedback": "Solid hooks"},
        {"name": "voice_personality", "score": 86, "feedback": "Strong personality"},
    ]
    return json.dumps({"dimensions": dims})


class TestScoreEndpoint:
    async def test_score_returns_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/score should return 200 with scores."""
        item = await _generate_one(client, session, mock_provider)

        # Now mock the scoring LLM call
        mock_provider.complete = AsyncMock(return_value=_make_score_response())

        response = await client.post(f"/api/content/{item['id']}/score")

        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "dimensions" in data
        assert len(data["dimensions"]) == 8
        assert isinstance(data["overall_score"], int)
        # Verify dimension structure
        dim = data["dimensions"][0]
        assert "name" in dim
        assert "score" in dim
        assert "feedback" in dim

    async def test_score_content_not_found_404(self, client: AsyncClient) -> None:
        """POST /api/content/{id}/score for non-existent content should return 404."""
        response = await client.post("/api/content/nonexistent-id/score")
        assert response.status_code == 404

    async def test_score_without_dna_400(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/score without DNA should return 400."""
        # Create clone without DNA
        clone = VoiceClone(id=nanoid.generate(), name="No DNA Clone")
        session.add(clone)
        await session.flush()

        # Create content directly (bypassing generate which needs DNA)
        content = Content(
            id=nanoid.generate(),
            clone_id=clone.id,
            platform="blog",
            status="draft",
            content_current="Some content.",
            content_original="Some content.",
            input_text="Write something.",
            word_count=2,
            char_count=13,
        )
        session.add(content)
        await session.commit()

        response = await client.post(f"/api/content/{content.id}/score")
        assert response.status_code == 400
        assert "DNA" in response.json()["detail"]


class TestFeedbackRegenEndpoint:
    async def test_feedback_regen_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/feedback-regen should return 200 with updated content."""
        item = await _generate_one(client, session, mock_provider)
        mock_provider.complete = AsyncMock(return_value="Improved with feedback.")

        response = await client.post(
            f"/api/content/{item['id']}/feedback-regen",
            json={"feedback": "Make it shorter."},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content_current"] == "Improved with feedback."
        assert data["content_original"] == item["content_original"]

    async def test_feedback_regen_404_missing_content(self, client: AsyncClient) -> None:
        """POST /api/content/{id}/feedback-regen for missing content should return 404."""
        response = await client.post(
            "/api/content/nonexistent-id/feedback-regen",
            json={"feedback": "Any feedback."},
        )
        assert response.status_code == 404

    async def test_feedback_regen_400_no_dna(
        self,
        client: AsyncClient,
        session: AsyncSession,
    ) -> None:
        """POST /api/content/{id}/feedback-regen without DNA should return 400."""
        clone = VoiceClone(id=nanoid.generate(), name="No DNA")
        session.add(clone)
        await session.flush()

        content = Content(
            clone_id=clone.id,
            platform="blog",
            status="draft",
            content_current="Some content.",
            content_original="Some content.",
            input_text="Write.",
            word_count=2,
            char_count=13,
        )
        session.add(content)
        await session.commit()

        response = await client.post(
            f"/api/content/{content.id}/feedback-regen",
            json={"feedback": "Improve."},
        )
        assert response.status_code == 400

    async def test_feedback_regen_422_empty_feedback(self, client: AsyncClient) -> None:
        """POST /api/content/{id}/feedback-regen with empty feedback should return 422."""
        response = await client.post(
            "/api/content/any-id/feedback-regen",
            json={"feedback": ""},
        )
        assert response.status_code == 422


class TestPartialRegenEndpoint:
    async def test_partial_regen_200(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/partial-regen should return 200 with updated content."""
        item = await _generate_one(client, session, mock_provider)
        mock_provider.complete = AsyncMock(return_value="replaced")

        response = await client.post(
            f"/api/content/{item['id']}/partial-regen",
            json={"selection_start": 0, "selection_end": 9},
        )

        assert response.status_code == 200
        data = response.json()
        # "Generated" (0-9) replaced with "replaced"
        assert data["content_current"].startswith("replaced")

    async def test_partial_regen_400_invalid_range(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/partial-regen with out-of-bounds range should return 400."""
        item = await _generate_one(client, session, mock_provider)

        response = await client.post(
            f"/api/content/{item['id']}/partial-regen",
            json={"selection_start": 0, "selection_end": 9999},
        )
        assert response.status_code == 400

    async def test_partial_regen_with_feedback(
        self,
        client: AsyncClient,
        session: AsyncSession,
        mock_provider: AsyncMock,
    ) -> None:
        """POST /api/content/{id}/partial-regen with feedback should pass it through."""
        item = await _generate_one(client, session, mock_provider)
        mock_provider.complete = AsyncMock(return_value="x")

        response = await client.post(
            f"/api/content/{item['id']}/partial-regen",
            json={
                "selection_start": 0,
                "selection_end": 1,
                "feedback": "Make it formal.",
            },
        )
        assert response.status_code == 200
