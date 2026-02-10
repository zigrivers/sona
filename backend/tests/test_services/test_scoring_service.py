"""Tests for confidence scoring algorithm and authenticity scoring service."""

import json
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ContentNotFoundError
from app.models.clone import VoiceClone
from app.models.content import Content
from app.models.dna import VoiceDNAVersion
from app.services.scoring_service import ScoringService, calculate_confidence


# ── Confidence scoring helpers ─────────────────────────────────────


def _make_sample(
    *,
    word_count: int = 100,
    content_type: str = "blog",
    length_category: str | None = "medium",
) -> SimpleNamespace:
    return SimpleNamespace(
        word_count=word_count,
        content_type=content_type,
        length_category=length_category,
    )


def _make_dna_version(
    *,
    version_number: int = 1,
    prominence_scores: dict[str, int] | None = None,
    data: dict[str, object] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        version_number=version_number,
        prominence_scores=prominence_scores,
        data=data or {},
    )


def _make_clone(
    *,
    samples: list[SimpleNamespace] | None = None,
    dna_versions: list[SimpleNamespace] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        samples=samples or [],
        dna_versions=dna_versions or [],
    )


class TestNoSamples:
    def test_no_samples_returns_zero(self) -> None:
        """Empty clone with no samples and no DNA should score 0."""
        clone = _make_clone()
        assert calculate_confidence(clone) == 0


class TestWordCountTiers:
    @pytest.mark.parametrize(
        ("word_count", "expected"),
        [
            (100, 5),
            (750, 10),
            (2000, 15),
            (4000, 22),
            (6000, 30),
        ],
    )
    def test_word_count_tiers(self, word_count: int, expected: int) -> None:
        """Word count component should follow tier thresholds."""
        clone = _make_clone(
            samples=[_make_sample(word_count=word_count)],
        )
        # Only word count component contributes; sample_count=1 adds 4,
        # type_variety=1 adds 5, length_mix=1 adds 5, no DNA=0
        score = calculate_confidence(clone)
        # Isolate: total = expected + 4 (1 sample) + 5 (1 type) + 5 (1 length) + 0
        assert score == expected + 4 + 5 + 5


class TestSampleCountTiers:
    @pytest.mark.parametrize(
        ("count", "expected_component"),
        [
            (1, 4),
            (2, 8),
            (3, 12),
            (5, 16),
            (8, 20),
        ],
    )
    def test_sample_count_tiers(self, count: int, expected_component: int) -> None:
        """Sample count component should follow tier thresholds."""
        # All samples same type and category to isolate sample count
        samples = [
            _make_sample(word_count=0, content_type="blog", length_category="medium")
            for _ in range(count)
        ]
        clone = _make_clone(samples=samples)
        # word_count=0 → 0, type_variety=1 → 5, length_mix=1 → 5, no DNA=0
        assert calculate_confidence(clone) == 0 + expected_component + 5 + 5 + 0


class TestTypeVarietyTiers:
    @pytest.mark.parametrize(
        ("types", "expected_component"),
        [
            (["blog"], 5),
            (["blog", "email"], 10),
            (["blog", "email", "tweet"], 15),
            (["blog", "email", "tweet", "linkedin", "essay"], 20),
        ],
    )
    def test_type_variety_tiers(self, types: list[str], expected_component: int) -> None:
        """Type variety component should follow tier thresholds."""
        samples = [
            _make_sample(word_count=0, content_type=t, length_category="medium") for t in types
        ]
        clone = _make_clone(samples=samples)
        count = len(types)
        # word_count=0, sample_count varies, length_mix=1 (all "medium"), no DNA
        sample_count_map = {1: 4, 2: 8, 3: 12, 5: 16}
        expected_total = 0 + sample_count_map[count] + expected_component + 5 + 0
        assert calculate_confidence(clone) == expected_total


class TestLengthMixTiers:
    @pytest.mark.parametrize(
        ("categories", "expected_component"),
        [
            (["short"], 5),
            (["short", "medium"], 10),
            (["short", "medium", "long"], 15),
        ],
    )
    def test_length_mix_tiers(self, categories: list[str], expected_component: int) -> None:
        """Length mix component should follow tier thresholds."""
        samples = [
            _make_sample(word_count=0, content_type="blog", length_category=cat)
            for cat in categories
        ]
        clone = _make_clone(samples=samples)
        count = len(categories)
        # word_count=0, type_variety=1 → 5, no DNA
        sample_count_map = {1: 4, 2: 8, 3: 12}
        expected_total = 0 + sample_count_map[count] + 5 + expected_component + 0
        assert calculate_confidence(clone) == expected_total


class TestConsistency:
    def test_not_analyzed_returns_zero(self) -> None:
        """No DNA versions should contribute 0 to consistency."""
        clone = _make_clone()
        assert calculate_confidence(clone) == 0

    def test_consistency_score_mapped_to_15_point_scale(self) -> None:
        """consistency_score=80 in DNA data should map to 12 (80*15/100)."""
        dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 80},
        )
        clone = _make_clone(dna_versions=[dna])
        # No samples → all other components are 0
        assert calculate_confidence(clone) == 12

    def test_consistency_score_100_gives_max(self) -> None:
        """consistency_score=100 should give max 15 points."""
        dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 100},
        )
        clone = _make_clone(dna_versions=[dna])
        assert calculate_confidence(clone) == 15

    def test_consistency_score_zero_gives_zero(self) -> None:
        """consistency_score=0 should give 0 points."""
        dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 0},
        )
        clone = _make_clone(dna_versions=[dna])
        assert calculate_confidence(clone) == 0

    def test_fallback_to_prominence_scores(self) -> None:
        """Without consistency_score, should fall back to avg prominence scores."""
        dna = _make_dna_version(
            version_number=1,
            prominence_scores={"tone": 80, "vocabulary": 60, "structure": 100},
        )
        clone = _make_clone(dna_versions=[dna])
        # avg = (80+60+100)/3 = 80 → (80/100)*15 = 12
        assert calculate_confidence(clone) == 12

    def test_consistency_uses_latest_version(self) -> None:
        """Should use the highest version_number for consistency."""
        old_dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 20},
        )
        new_dna = _make_dna_version(
            version_number=2,
            data={"consistency_score": 100},
        )
        clone = _make_clone(dna_versions=[old_dna, new_dna])
        # consistency_score=100 → 15
        assert calculate_confidence(clone) == 15


class TestFullScore:
    def test_full_score_sums_all_components(self) -> None:
        """All components present should sum correctly."""
        samples = [
            _make_sample(word_count=2000, content_type="blog", length_category="short"),
            _make_sample(word_count=2000, content_type="email", length_category="medium"),
            _make_sample(word_count=1500, content_type="tweet", length_category="long"),
        ]
        dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 70},
        )
        clone = _make_clone(samples=samples, dna_versions=[dna])
        # word_count=5500 → 30
        # sample_count=3 → 12
        # type_variety=3 → 15
        # length_mix=3 → 15
        # consistency: 70*15/100=10.5 → int(10.5)=10
        assert calculate_confidence(clone) == 30 + 12 + 15 + 15 + 10

    def test_score_capped_at_100(self) -> None:
        """Score should never exceed 100."""
        # Maximise every component
        types = ["blog", "email", "tweet", "linkedin"]
        categories = ["short", "medium", "long"]
        samples = []
        for i in range(8):
            samples.append(
                _make_sample(
                    word_count=1000,
                    content_type=types[i % len(types)],
                    length_category=categories[i % len(categories)],
                )
            )
        dna = _make_dna_version(
            version_number=1,
            data={"consistency_score": 100},
        )
        clone = _make_clone(samples=samples, dna_versions=[dna])
        # word_count=8000 → 30, sample_count=8 → 20, type_variety=4 → 20,
        # length_mix=3 → 15, consistency=100 → 15 => total=100
        assert calculate_confidence(clone) == 100


# ── Authenticity scoring helpers ───────────────────────────────────

DIMENSIONS = [
    "vocabulary_match",
    "sentence_flow",
    "structural_rhythm",
    "tone_fidelity",
    "rhetorical_fingerprint",
    "punctuation_signature",
    "hook_and_close",
    "voice_personality",
]


def _make_llm_response(scores: list[int] | None = None) -> str:
    """Build a fake LLM JSON response with 8 dimension scores."""
    if scores is None:
        scores = [85, 90, 78, 92, 88, 75, 80, 86]
    dims = [
        {
            "name": name,
            "score": score,
            "feedback": f"Good {name}" if score >= 70 else f"Improve {name}",
        }
        for name, score in zip(DIMENSIONS, scores, strict=True)
    ]
    return json.dumps({"dimensions": dims})


async def _create_clone(session: AsyncSession) -> VoiceClone:
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.flush()
    return clone


async def _create_dna(
    session: AsyncSession,
    clone_id: str,
    data: dict[str, Any] | None = None,
) -> VoiceDNAVersion:
    dna = VoiceDNAVersion(
        id=nanoid.generate(),
        clone_id=clone_id,
        version_number=1,
        data=data or {"tone": "conversational", "humor": "dry", "formality": "casual"},
        trigger="initial_analysis",
        model_used="test-model",
    )
    session.add(dna)
    await session.flush()
    return dna


async def _create_content(session: AsyncSession, clone_id: str) -> Content:
    content = Content(
        id=nanoid.generate(),
        clone_id=clone_id,
        platform="blog",
        status="draft",
        content_current="This is generated content for scoring.",
        content_original="This is generated content for scoring.",
        input_text="Write a blog post.",
        word_count=6,
        char_count=43,
    )
    session.add(content)
    await session.flush()
    return content


class TestScoringService:
    async def test_score_returns_8_dimensions(self, session: AsyncSession) -> None:
        """score() should return content with all 8 dimension scores."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        content = await _create_content(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_llm_response())

        service = ScoringService(session, mock_provider)
        scored = await service.score(content.id)

        assert scored.score_dimensions is not None
        dims = scored.score_dimensions["dimensions"]
        assert len(dims) == 8
        dim_names = {d["name"] for d in dims}
        assert dim_names == set(DIMENSIONS)

    async def test_overall_score_is_average(self, session: AsyncSession) -> None:
        """overall_score should be round(mean(dimension_scores))."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        content = await _create_content(session, clone.id)

        scores = [80, 90, 70, 60, 85, 75, 95, 65]
        expected = round(sum(scores) / len(scores))

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_llm_response(scores))

        service = ScoringService(session, mock_provider)
        scored = await service.score(content.id)

        assert scored.authenticity_score == expected

    async def test_dimension_below_70_has_feedback(self, session: AsyncSession) -> None:
        """Dimensions scoring below 70 must have non-empty feedback."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        content = await _create_content(session, clone.id)

        scores = [85, 90, 50, 92, 88, 40, 80, 86]
        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_llm_response(scores))

        service = ScoringService(session, mock_provider)
        scored = await service.score(content.id)

        dims = scored.score_dimensions["dimensions"]
        for dim in dims:
            if dim["score"] < 70:
                assert dim["feedback"], f"Missing feedback for {dim['name']} (score {dim['score']})"

    async def test_scoring_prompt_includes_dna(self, session: AsyncSession) -> None:
        """The scoring prompt should include Voice DNA data."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id, data={"tone": "witty", "humor": "sarcastic"})
        content = await _create_content(session, clone.id)

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return _make_llm_response()

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = ScoringService(session, mock_provider)
        await service.score(content.id)

        assert len(captured_messages) == 1
        full_prompt = " ".join(m["content"] for m in captured_messages[0])
        assert "witty" in full_prompt.lower()
        assert "sarcastic" in full_prompt.lower()

    async def test_scoring_prompt_includes_content(self, session: AsyncSession) -> None:
        """The scoring prompt should include the generated content text."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        content = await _create_content(session, clone.id)

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return _make_llm_response()

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = ScoringService(session, mock_provider)
        await service.score(content.id)

        assert len(captured_messages) == 1
        full_prompt = " ".join(m["content"] for m in captured_messages[0])
        assert "This is generated content for scoring." in full_prompt

    async def test_score_content_not_found(self, session: AsyncSession) -> None:
        """score() should raise ContentNotFoundError for missing content."""
        mock_provider = AsyncMock()
        service = ScoringService(session, mock_provider)

        with pytest.raises(ContentNotFoundError):
            await service.score("nonexistent-id")

    async def test_score_persisted_to_db(self, session: AsyncSession) -> None:
        """score() should persist authenticity_score and score_dimensions to the content row."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        content = await _create_content(session, clone.id)

        scores = [85, 90, 78, 92, 88, 75, 80, 86]
        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_llm_response(scores))

        service = ScoringService(session, mock_provider)
        await service.score(content.id)
        await session.flush()

        # Re-fetch from DB to confirm persistence
        await session.refresh(content)
        assert content.authenticity_score == round(sum(scores) / len(scores))
        assert content.score_dimensions is not None
        assert len(content.score_dimensions["dimensions"]) == 8
