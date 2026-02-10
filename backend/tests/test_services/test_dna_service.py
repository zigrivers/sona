"""Tests for DNA analysis service."""

import json
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AnalysisFailedError, CloneNotFoundError
from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings, MethodologyVersion
from app.models.sample import WritingSample
from app.services.dna_service import DNAService

MOCK_DNA_RESPONSE = json.dumps(
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


async def _create_clone(session: AsyncSession, *, with_samples: bool = True) -> VoiceClone:
    """Create a test clone, optionally with samples."""
    clone = VoiceClone(name="Test Clone")
    session.add(clone)
    await session.flush()

    if with_samples:
        sample = WritingSample(
            clone_id=clone.id,
            content="This is a writing sample for voice analysis.",
            content_type="blog_post",
            word_count=8,
            source_type="paste",
        )
        session.add(sample)
        await session.flush()

    return clone


async def _seed_methodology(session: AsyncSession) -> None:
    """Seed the voice_cloning methodology section."""
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
    await session.flush()


class TestAnalyze:
    async def test_creates_dna_version(self, session: AsyncSession) -> None:
        """analyze creates a new VoiceDNAVersion."""
        clone = await _create_clone(session)
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        dna = await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        assert dna is not None
        assert dna.clone_id == clone.id
        assert dna.version_number == 1
        assert dna.trigger == "initial_analysis"
        assert dna.model_used == "gpt-4o"
        assert "vocabulary" in dna.data

    async def test_second_analysis_increments_version(self, session: AsyncSession) -> None:
        """Second analyze call creates version 2 with trigger='regeneration'."""
        clone = await _create_clone(session)
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        await svc.analyze(clone.id, mock_provider, model="gpt-4o")
        dna2 = await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        assert dna2.version_number == 2
        assert dna2.trigger == "regeneration"

    async def test_no_samples_raises_error(self, session: AsyncSession) -> None:
        """analyze raises ValueError when clone has no samples."""
        clone = await _create_clone(session, with_samples=False)

        mock_provider = AsyncMock()
        svc = DNAService(session)

        with pytest.raises(ValueError, match="no writing samples"):
            await svc.analyze(clone.id, mock_provider, model="gpt-4o")

    async def test_clone_not_found_raises_error(self, session: AsyncSession) -> None:
        """analyze raises CloneNotFoundError for non-existent clone."""
        mock_provider = AsyncMock()
        svc = DNAService(session)

        with pytest.raises(CloneNotFoundError):
            await svc.analyze("nonexistent", mock_provider, model="gpt-4o")

    async def test_sends_all_samples_to_llm(self, session: AsyncSession) -> None:
        """analyze sends all clone samples in the LLM prompt."""
        clone = await _create_clone(session)
        # Add a second sample
        sample2 = WritingSample(
            clone_id=clone.id,
            content="Another writing sample here.",
            content_type="email",
            word_count=4,
            source_type="paste",
        )
        session.add(sample2)
        await session.flush()
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        # Verify LLM was called with messages containing both samples
        call_args = mock_provider.complete.call_args
        messages = call_args.args[0] if call_args.args else call_args.kwargs["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")
        assert "Sample 1" in user_msg["content"]
        assert "Sample 2" in user_msg["content"]

    async def test_includes_methodology_in_prompt(self, session: AsyncSession) -> None:
        """analyze includes methodology instructions in the LLM prompt."""
        clone = await _create_clone(session)
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        call_args = mock_provider.complete.call_args
        messages = call_args.args[0] if call_args.args else call_args.kwargs["messages"]
        system_msg = next(m for m in messages if m["role"] == "system")
        assert "9 dimensions" in system_msg["content"]

    async def test_llm_failure_raises_analysis_failed(self, session: AsyncSession) -> None:
        """analyze raises AnalysisFailedError when LLM fails."""
        clone = await _create_clone(session)
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=Exception("LLM down"))

        svc = DNAService(session)

        with pytest.raises(AnalysisFailedError):
            await svc.analyze(clone.id, mock_provider, model="gpt-4o")

    async def test_parses_prominence_scores(self, session: AsyncSession) -> None:
        """analyze extracts prominence_scores from LLM response."""
        clone = await _create_clone(session)
        await _seed_methodology(session)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        dna = await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        assert dna.prominence_scores is not None
        assert len(dna.prominence_scores) == 9
        assert dna.prominence_scores["vocabulary"] == 85


class TestGetCurrentDNA:
    async def test_returns_latest_version(self, session: AsyncSession) -> None:
        """get_current returns the latest DNA version."""
        clone = await _create_clone(session)
        dna1 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data={"vocabulary": {}},
            trigger="initial_analysis",
            model_used="gpt-4o",
        )
        dna2 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=2,
            data={"vocabulary": {"updated": True}},
            trigger="regeneration",
            model_used="gpt-4o",
        )
        session.add_all([dna1, dna2])
        await session.flush()

        svc = DNAService(session)
        result = await svc.get_current(clone.id)

        assert result is not None
        assert result.version_number == 2

    async def test_returns_none_when_no_dna(self, session: AsyncSession) -> None:
        """get_current returns None when clone has no DNA."""
        clone = await _create_clone(session, with_samples=False)

        svc = DNAService(session)
        result = await svc.get_current(clone.id)

        assert result is None


class TestManualEdit:
    async def test_creates_version_with_manual_edit_trigger(self, session: AsyncSession) -> None:
        """manual_edit creates a new version with trigger='manual_edit'."""
        clone = await _create_clone(session, with_samples=False)
        # Seed an initial DNA version
        v1 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data={"vocabulary": {"level": "basic"}},
            prominence_scores={"vocabulary": 50},
            trigger="initial_analysis",
            model_used="gpt-4o",
        )
        session.add(v1)
        await session.flush()

        svc = DNAService(session)
        new_data = {"vocabulary": {"level": "advanced"}}
        new_scores = {"vocabulary": 90}
        result = await svc.manual_edit(clone.id, data=new_data, prominence_scores=new_scores)

        assert result.version_number == 2
        assert result.trigger == "manual_edit"
        assert result.data == new_data
        assert result.prominence_scores == new_scores
        assert result.model_used == "manual"

    async def test_manual_edit_no_existing_dna_raises(self, session: AsyncSession) -> None:
        """manual_edit raises ValueError when clone has no DNA to edit."""
        clone = await _create_clone(session, with_samples=False)

        svc = DNAService(session)
        with pytest.raises(ValueError, match="no existing DNA"):
            await svc.manual_edit(clone.id, data={"vocabulary": {}})


class TestRevert:
    async def test_revert_copies_old_dna(self, session: AsyncSession) -> None:
        """revert creates a new version copying old DNA data."""
        clone = await _create_clone(session, with_samples=False)
        v1 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data={"vocabulary": {"level": "basic"}},
            prominence_scores={"vocabulary": 50},
            trigger="initial_analysis",
            model_used="gpt-4o",
        )
        v2 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=2,
            data={"vocabulary": {"level": "advanced"}},
            prominence_scores={"vocabulary": 90},
            trigger="regeneration",
            model_used="gpt-4o",
        )
        session.add_all([v1, v2])
        await session.flush()

        svc = DNAService(session)
        result = await svc.revert(clone.id, target_version=1)

        assert result.version_number == 3
        assert result.trigger == "revert"
        assert result.data == {"vocabulary": {"level": "basic"}}
        assert result.prominence_scores == {"vocabulary": 50}
        assert result.model_used == v1.model_used

    async def test_revert_missing_version_raises(self, session: AsyncSession) -> None:
        """revert raises ValueError when target version doesn't exist."""
        clone = await _create_clone(session, with_samples=False)
        v1 = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data={"vocabulary": {}},
            trigger="initial_analysis",
            model_used="gpt-4o",
        )
        session.add(v1)
        await session.flush()

        svc = DNAService(session)
        with pytest.raises(ValueError, match="Version 99 not found"):
            await svc.revert(clone.id, target_version=99)

    async def test_revert_is_non_destructive(self, session: AsyncSession) -> None:
        """revert does not delete the original versions."""
        clone = await _create_clone(session, with_samples=False)
        for i in range(1, 3):
            v = VoiceDNAVersion(
                clone_id=clone.id,
                version_number=i,
                data={"version": i},
                trigger="analysis",
                model_used="gpt-4o",
            )
            session.add(v)
        await session.flush()

        svc = DNAService(session)
        await svc.revert(clone.id, target_version=1)

        versions = await svc.list_versions(clone.id)
        assert len(versions) == 3  # Original 2 + revert = 3


class TestPruning:
    async def test_prune_oldest_at_11_versions(self, session: AsyncSession) -> None:
        """Creating an 11th version prunes the oldest, leaving 10."""
        clone = await _create_clone(session, with_samples=False)
        for i in range(1, 12):
            v = VoiceDNAVersion(
                clone_id=clone.id,
                version_number=i,
                data={"version": i},
                trigger="analysis",
                model_used="gpt-4o",
            )
            session.add(v)
        await session.flush()

        svc = DNAService(session)
        await svc._prune_versions(clone.id)

        versions = await svc.list_versions(clone.id)
        assert len(versions) == 10
        assert versions[-1].version_number == 2  # version 1 was pruned

    async def test_no_prune_under_10_versions(self, session: AsyncSession) -> None:
        """No pruning occurs when there are fewer than 10 versions."""
        clone = await _create_clone(session, with_samples=False)
        for i in range(1, 6):
            v = VoiceDNAVersion(
                clone_id=clone.id,
                version_number=i,
                data={"version": i},
                trigger="analysis",
                model_used="gpt-4o",
            )
            session.add(v)
        await session.flush()

        svc = DNAService(session)
        await svc._prune_versions(clone.id)

        versions = await svc.list_versions(clone.id)
        assert len(versions) == 5

    async def test_analyze_triggers_pruning(self, session: AsyncSession) -> None:
        """analyze auto-prunes when version count exceeds limit."""
        clone = await _create_clone(session)
        await _seed_methodology(session)
        # Seed 10 existing versions
        for i in range(1, 11):
            v = VoiceDNAVersion(
                clone_id=clone.id,
                version_number=i,
                data={"version": i},
                trigger="analysis",
                model_used="gpt-4o",
            )
            session.add(v)
        await session.flush()

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=MOCK_DNA_RESPONSE)

        svc = DNAService(session)
        dna = await svc.analyze(clone.id, mock_provider, model="gpt-4o")

        assert dna.version_number == 11
        versions = await svc.list_versions(clone.id)
        assert len(versions) == 10


class TestListVersions:
    async def test_returns_versions_descending(self, session: AsyncSession) -> None:
        """list_versions returns versions ordered by version_number desc."""
        clone = await _create_clone(session, with_samples=False)
        for i in range(1, 4):
            v = VoiceDNAVersion(
                clone_id=clone.id,
                version_number=i,
                data={"version": i},
                trigger="analysis",
                model_used="gpt-4o",
            )
            session.add(v)
        await session.flush()

        svc = DNAService(session)
        versions = await svc.list_versions(clone.id)

        assert len(versions) == 3
        assert versions[0].version_number == 3
        assert versions[-1].version_number == 1
