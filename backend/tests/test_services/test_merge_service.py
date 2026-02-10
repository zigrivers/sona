"""Tests for merge service."""

import json
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, MergeFailedError
from app.models.clone import MergedCloneSource, VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.sample import WritingSample
from app.schemas.sample import SampleCreate
from app.services.merge_service import MergeService
from app.services.sample_service import SampleService

MOCK_MERGE_RESPONSE = json.dumps(
    {
        "dna": {
            "vocabulary": {"complexity_level": "advanced", "jargon_usage": "moderate"},
            "sentence_structure": {"average_length": "medium"},
            "paragraph_structure": {"average_length": "short"},
            "tone": {"formality_level": "semi-formal", "primary_tone": "authoritative"},
            "rhetorical_devices": {"metaphor_usage": "frequent"},
            "punctuation": {"em_dash_frequency": "high"},
            "openings_and_closings": {"hook_style": "provocative"},
            "humor": {"frequency": "moderate"},
            "signatures": {"catchphrases": ["blended phrase"]},
        },
        "prominence_scores": {
            "vocabulary": 80,
            "sentence_structure": 65,
            "paragraph_structure": 50,
            "tone": 75,
            "rhetorical_devices": 55,
            "punctuation": 70,
            "openings_and_closings": 45,
            "humor": 35,
            "signatures": 60,
        },
    }
)


async def _setup_source_clones(session: AsyncSession, count: int = 2) -> list[VoiceClone]:
    """Create N clones each with DNA version 1."""
    clones = []
    for i in range(count):
        clone = VoiceClone(name=f"Source Clone {i + 1}")
        session.add(clone)
        await session.flush()

        # Add a sample so confidence scoring works
        sample = WritingSample(
            clone_id=clone.id,
            content=f"Sample text for clone {i + 1}.",
            content_type="blog_post",
            word_count=6,
            source_type="paste",
        )
        session.add(sample)

        dna = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data={
                "vocabulary": {"complexity_level": "basic"},
                "tone": {"formality_level": "casual"},
            },
            prominence_scores={"vocabulary": 50 + i * 10, "tone": 60 + i * 10},
            trigger="initial_analysis",
            model_used="gpt-4o",
        )
        session.add(dna)
        await session.flush()
        clones.append(clone)
    return clones


class TestMerge:
    async def test_merge_creates_new_clone(self, session: AsyncSession) -> None:
        """merge returns a clone with type='merged' and correct name."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        result = await svc.merge(
            name="Blended Voice",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 70, "tone": 30}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 30, "tone": 70}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        assert result.name == "Blended Voice"
        assert result.type == "merged"

    async def test_merge_stores_source_lineage(self, session: AsyncSession) -> None:
        """MergedCloneSource records are created with correct weights."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        result = await svc.merge(
            name="Lineage Test",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 60, "tone": 40}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 40, "tone": 60}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        stmt = select(MergedCloneSource).where(MergedCloneSource.merged_clone_id == result.id)
        rows = (await session.execute(stmt)).scalars().all()
        assert len(rows) == 2

        source_ids = {r.source_clone_id for r in rows}
        assert source_ids == {clones[0].id, clones[1].id}

        # Check weights stored correctly
        for row in rows:
            assert "vocabulary" in row.weights

    async def test_merge_sends_dna_and_weights_to_llm(self, session: AsyncSession) -> None:
        """provider.complete() call contains all source DNAs and weight info."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        await svc.merge(
            name="LLM Check",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 50, "tone": 50}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 50, "tone": 50}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        provider.complete.assert_called_once()
        call_args = provider.complete.call_args
        messages = call_args.args[0] if call_args.args else call_args.kwargs["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")

        # Both source clone names should appear
        assert "Source Clone 1" in user_msg["content"]
        assert "Source Clone 2" in user_msg["content"]
        # Weights should appear
        assert "vocabulary" in user_msg["content"]

    async def test_merged_clone_type_is_merged(self, session: AsyncSession) -> None:
        """The created clone has type == 'merged'."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        result = await svc.merge(
            name="Type Check",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 50}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 50}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        assert result.type == "merged"

        # Also verify DNA version was created
        stmt = select(VoiceDNAVersion).where(VoiceDNAVersion.clone_id == result.id)
        dna = (await session.execute(stmt)).scalar_one()
        assert dna.version_number == 1
        assert dna.trigger == "merge"

    async def test_merged_clone_rejects_samples(self, session: AsyncSession) -> None:
        """SampleService.create() raises ValueError for merged clone."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        merged = await svc.merge(
            name="No Samples",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 50}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 50}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        sample_svc = SampleService(session)
        data = SampleCreate(content="Test sample", content_type="blog_post")
        with pytest.raises(ValueError, match="Cannot add samples to a merged clone"):
            await sample_svc.create(merged.id, data)

    async def test_source_deletion_shows_deleted_label(self, session: AsyncSession) -> None:
        """After deleting a source clone, MergedCloneSource still exists but source is gone."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        merged = await svc.merge(
            name="Deleted Source",
            source_clones=[
                {"clone_id": clones[0].id, "weights": {"vocabulary": 50}},
                {"clone_id": clones[1].id, "weights": {"vocabulary": 50}},
            ],
            provider=provider,
            model="gpt-4o",
        )

        # Delete one source clone
        deleted_id = clones[0].id
        await session.delete(clones[0])
        await session.flush()

        # Lineage records should still exist for the merged clone
        stmt = select(MergedCloneSource).where(MergedCloneSource.merged_clone_id == merged.id)
        rows = list((await session.execute(stmt)).scalars().all())
        assert len(rows) == 2

        # The source clone should be gone
        result = await session.execute(select(VoiceClone).where(VoiceClone.id == deleted_id))
        assert result.scalar_one_or_none() is None

    async def test_merge_failure_no_clone_created(self, session: AsyncSession) -> None:
        """LLM raises exception — no clone or DNA records should exist."""
        clones = await _setup_source_clones(session, count=2)
        provider = AsyncMock()
        provider.complete = AsyncMock(side_effect=Exception("LLM down"))

        svc = MergeService(session)
        with pytest.raises(MergeFailedError):
            await svc.merge(
                name="Should Not Exist",
                source_clones=[
                    {"clone_id": clones[0].id, "weights": {"vocabulary": 50}},
                    {"clone_id": clones[1].id, "weights": {"vocabulary": 50}},
                ],
                provider=provider,
                model="gpt-4o",
            )

        # Verify no merged clone was created
        stmt = select(VoiceClone).where(VoiceClone.name == "Should Not Exist")
        result = await session.execute(stmt)
        assert result.scalar_one_or_none() is None

    async def test_merge_with_nonexistent_source_raises(self, session: AsyncSession) -> None:
        """merge raises CloneNotFoundError when a source clone doesn't exist."""
        clones = await _setup_source_clones(session, count=1)
        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        with pytest.raises(CloneNotFoundError):
            await svc.merge(
                name="Bad Source",
                source_clones=[
                    {"clone_id": clones[0].id, "weights": {"vocabulary": 50}},
                    {"clone_id": "nonexistent", "weights": {"vocabulary": 50}},
                ],
                provider=provider,
                model="gpt-4o",
            )

    async def test_merge_source_without_dna_raises(self, session: AsyncSession) -> None:
        """merge raises ValueError when a source clone has no DNA."""
        clone_with_dna = (await _setup_source_clones(session, count=1))[0]

        # Create a clone without DNA
        clone_no_dna = VoiceClone(name="No DNA Clone")
        session.add(clone_no_dna)
        await session.flush()

        provider = AsyncMock()
        provider.complete = AsyncMock(return_value=MOCK_MERGE_RESPONSE)

        svc = MergeService(session)
        with pytest.raises(ValueError, match="no DNA"):
            await svc.merge(
                name="Missing DNA",
                source_clones=[
                    {"clone_id": clone_with_dna.id, "weights": {"vocabulary": 50}},
                    {"clone_id": clone_no_dna.id, "weights": {"vocabulary": 50}},
                ],
                provider=provider,
                model="gpt-4o",
            )
