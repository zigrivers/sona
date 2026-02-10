"""Integration tests for merge endpoint via HTTP client."""

import json
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.sample import WritingSample

MOCK_MERGE_RESPONSE = json.dumps(
    {
        "dna": {
            "vocabulary": {"complexity_level": "advanced"},
            "tone": {"formality_level": "semi-formal"},
        },
        "prominence_scores": {"vocabulary": 80, "tone": 75},
    }
)


async def _create_source_clone(session: AsyncSession, name: str = "Source") -> VoiceClone:
    """Create a source clone with DNA and a sample."""
    clone = VoiceClone(name=name)
    session.add(clone)
    await session.flush()

    sample = WritingSample(
        clone_id=clone.id,
        content="Sample text.",
        content_type="blog_post",
        word_count=2,
        source_type="paste",
    )
    session.add(sample)

    dna = VoiceDNAVersion(
        clone_id=clone.id,
        version_number=1,
        data={"vocabulary": {"complexity_level": "basic"}},
        prominence_scores={"vocabulary": 50},
        trigger="initial_analysis",
        model_used="gpt-4o",
    )
    session.add(dna)
    await session.commit()
    return clone


async def test_merge_endpoint_creates_merged_clone(
    client: AsyncClient, session: AsyncSession
) -> None:
    """POST /api/clones/merge with valid data returns 201 and merged clone."""
    clone_a = await _create_source_clone(session, name="Clone A")
    clone_b = await _create_source_clone(session, name="Clone B")

    mock_provider = AsyncMock()
    mock_provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

    with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
        response = await client.post(
            "/api/clones/merge",
            json={
                "name": "Merged Voice",
                "source_clones": [
                    {"clone_id": clone_a.id, "weights": {"vocabulary": 60}},
                    {"clone_id": clone_b.id, "weights": {"vocabulary": 40}},
                ],
            },
        )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Merged Voice"
    assert data["type"] == "merged"
    assert "id" in data


async def test_merge_endpoint_too_few_sources(client: AsyncClient) -> None:
    """POST /api/clones/merge with <2 sources returns 422 (Pydantic validation)."""
    response = await client.post(
        "/api/clones/merge",
        json={
            "name": "Bad Merge",
            "source_clones": [
                {"clone_id": "some-id", "weights": {"vocabulary": 100}},
            ],
        },
    )

    assert response.status_code == 422


async def test_merge_endpoint_missing_dna_returns_400(
    client: AsyncClient, session: AsyncSession
) -> None:
    """POST /api/clones/merge with source missing DNA returns 400."""
    clone_a = await _create_source_clone(session, name="With DNA")

    # Create clone without DNA
    clone_no_dna = VoiceClone(name="No DNA")
    session.add(clone_no_dna)
    await session.commit()

    mock_provider = AsyncMock()
    mock_provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

    with patch("app.api.clones.get_llm_provider", return_value=mock_provider):
        response = await client.post(
            "/api/clones/merge",
            json={
                "name": "DNA Missing",
                "source_clones": [
                    {"clone_id": clone_a.id, "weights": {"vocabulary": 50}},
                    {"clone_id": clone_no_dna.id, "weights": {"vocabulary": 50}},
                ],
            },
        )

    assert response.status_code == 400
