"""Tests for DNA analysis API endpoints."""

import json
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

MOCK_DNA_RESPONSE = json.dumps(
    {
        "dna": {
            "vocabulary": {"complexity_level": "advanced"},
            "sentence_structure": {"average_length": "medium"},
            "paragraph_structure": {"average_length": "short"},
            "tone": {"formality_level": "semi-formal"},
            "rhetorical_devices": {"metaphor_usage": "frequent"},
            "punctuation": {"em_dash_frequency": "high"},
            "openings_and_closings": {"hook_style": "provocative"},
            "humor": {"frequency": "moderate"},
            "signatures": {"catchphrases": ["at the end of the day"]},
        },
        "prominence_scores": {
            "vocabulary": 85,
            "sentence_structure": 70,
            "paragraph_structure": 55,
            "tone": 80,
            "rhetorical_devices": 60,
            "punctuation": 75,
            "openings_and_closings": 50,
            "humor": 40,
            "signatures": 65,
        },
    }
)


async def _create_clone_with_samples(client: AsyncClient) -> str:
    """Create a clone via API and add a sample directly via DB."""
    resp = await client.post("/api/clones", json={"name": "Test Clone"})
    assert resp.status_code == 201
    clone_id = resp.json()["id"]

    # Add sample and methodology via the session
    from app.database import get_session
    from app.main import app
    from app.models.methodology import MethodologySettings, MethodologyVersion
    from app.models.sample import WritingSample

    override = app.dependency_overrides[get_session]

    async for session in override():
        sample = WritingSample(
            clone_id=clone_id,
            content="This is a writing sample for voice analysis.",
            content_type="blog_post",
            word_count=8,
            source_type="paste",
        )
        session.add(sample)
        await session.flush()

        settings = MethodologySettings(
            section_key="voice_cloning",
            current_content="Analyze voice patterns across 9 dimensions.",
        )
        session.add(settings)
        await session.flush()
        version = MethodologyVersion(
            settings_id=settings.id,
            version_number=1,
            content=settings.current_content,
            trigger="seed",
        )
        session.add(version)
        await session.commit()

    return clone_id


class TestAnalyzeEndpoint:
    async def test_analyze_returns_201(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/analyze returns 201 with DNA."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            resp = await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert data["clone_id"] == clone_id
        assert data["version_number"] == 1
        assert data["trigger"] == "initial_analysis"
        assert "vocabulary" in data["data"]

    async def test_analyze_clone_not_found(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/analyze returns 404 for missing clone."""
        mock_provider = AsyncMock()

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            resp = await client.post(
                "/api/clones/nonexistent/analyze",
                json={"model": "gpt-4o"},
            )

        assert resp.status_code == 404

    async def test_analyze_no_samples_returns_400(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/analyze returns 400 when clone has no samples."""
        resp = await client.post("/api/clones", json={"name": "Empty Clone"})
        clone_id = resp.json()["id"]

        mock_provider = AsyncMock()

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            resp = await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        assert resp.status_code == 400

    async def test_analyze_llm_failure_returns_502(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/analyze returns 502 when LLM fails."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=Exception("LLM down"))

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            resp = await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        assert resp.status_code == 502


class TestGetDNAEndpoint:
    async def test_get_dna_returns_current(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna returns the latest DNA version."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        resp = await client.get(f"/api/clones/{clone_id}/dna")
        assert resp.status_code == 200
        assert resp.json()["version_number"] == 1

    async def test_get_dna_not_found(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna returns 404 when no DNA exists."""
        resp = await client.post("/api/clones", json={"name": "No DNA Clone"})
        clone_id = resp.json()["id"]

        resp = await client.get(f"/api/clones/{clone_id}/dna")
        assert resp.status_code == 404


class TestListDNAVersionsEndpoint:
    async def test_list_versions(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna/versions returns versions descending."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        resp = await client.get(f"/api/clones/{clone_id}/dna/versions")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["items"][0]["version_number"] == 2
        assert data["items"][1]["version_number"] == 1

    async def test_list_versions_empty(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna/versions returns empty list when no DNA."""
        resp = await client.post("/api/clones", json={"name": "Empty Clone"})
        clone_id = resp.json()["id"]

        resp = await client.get(f"/api/clones/{clone_id}/dna/versions")
        assert resp.status_code == 200
        assert resp.json()["items"] == []


class TestDNAPromptEndpoint:
    async def test_get_prompt_returns_200(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna/prompt returns 200 with prompt text."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        resp = await client.get(f"/api/clones/{clone_id}/dna/prompt")
        assert resp.status_code == 200
        data = resp.json()
        assert "prompt" in data
        assert data["prompt"].startswith("Write in a style that")
        assert "advanced" in data["prompt"]

    async def test_get_prompt_not_found(self, client: AsyncClient) -> None:
        """GET /api/clones/{id}/dna/prompt returns 404 when no DNA exists."""
        resp = await client.post("/api/clones", json={"name": "No DNA Clone"})
        clone_id = resp.json()["id"]

        resp = await client.get(f"/api/clones/{clone_id}/dna/prompt")
        assert resp.status_code == 404


class TestManualEditEndpoint:
    async def test_manual_edit_returns_200(self, client: AsyncClient) -> None:
        """PUT /api/clones/{id}/dna returns 200 with new version."""
        clone_id = await _create_clone_with_samples(client)

        # First, create initial DNA via analyze
        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)
        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        # Now manual edit
        resp = await client.put(
            f"/api/clones/{clone_id}/dna",
            json={
                "data": {"vocabulary": {"level": "expert"}},
                "prominence_scores": {"vocabulary": 95},
            },
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["version_number"] == 2
        assert data["trigger"] == "manual_edit"
        assert data["model_used"] == "manual"

    async def test_manual_edit_no_existing_dna_returns_400(self, client: AsyncClient) -> None:
        """PUT /api/clones/{id}/dna returns 400 when no DNA exists."""
        resp = await client.post("/api/clones", json={"name": "No DNA"})
        clone_id = resp.json()["id"]

        resp = await client.put(
            f"/api/clones/{clone_id}/dna",
            json={"data": {"vocabulary": {}}},
        )

        assert resp.status_code == 400


class TestRevertEndpoint:
    async def test_revert_returns_201(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/dna/revert/{version} returns 201."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)
        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        resp = await client.post(f"/api/clones/{clone_id}/dna/revert/1")

        assert resp.status_code == 201
        data = resp.json()
        assert data["version_number"] == 3
        assert data["trigger"] == "revert"

    async def test_revert_missing_version_returns_400(self, client: AsyncClient) -> None:
        """POST /api/clones/{id}/dna/revert/{version} returns 400 for bad version."""
        clone_id = await _create_clone_with_samples(client)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)
        with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
            await client.post(
                f"/api/clones/{clone_id}/analyze",
                json={"model": "gpt-4o"},
            )

        resp = await client.post(f"/api/clones/{clone_id}/dna/revert/99")

        assert resp.status_code == 400
