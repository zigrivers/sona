"""Tests for confidence scoring service."""

from types import SimpleNamespace

import pytest

from app.services.scoring_service import calculate_confidence


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
