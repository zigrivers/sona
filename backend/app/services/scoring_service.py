"""Confidence scoring algorithm for voice clones."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.constants import (
    CONFIDENCE_MAX_CONSISTENCY,
    CONFIDENCE_MAX_LENGTH_MIX,
    CONFIDENCE_MAX_SAMPLE_COUNT,
    CONFIDENCE_MAX_TYPE_VARIETY,
    CONFIDENCE_MAX_WORD_COUNT,
)

if TYPE_CHECKING:
    from app.models.clone import VoiceClone


def _score_word_count(total_words: int) -> int:
    """Score based on total word count across all samples."""
    if total_words >= 5000:
        return CONFIDENCE_MAX_WORD_COUNT  # 30
    if total_words >= 2500:
        return 22
    if total_words >= 1000:
        return 15
    if total_words >= 500:
        return 10
    if total_words > 0:
        return 5
    return 0


def _score_sample_count(count: int) -> int:
    """Score based on number of samples."""
    if count >= 6:
        return CONFIDENCE_MAX_SAMPLE_COUNT  # 20
    if count >= 5:
        return 16
    if count >= 3:
        return 12
    if count >= 2:
        return 8
    if count >= 1:
        return 4
    return 0


def _score_type_variety(unique_types: int) -> int:
    """Score based on number of distinct content types."""
    if unique_types >= 4:
        return CONFIDENCE_MAX_TYPE_VARIETY  # 20
    if unique_types >= 3:
        return 15
    if unique_types >= 2:
        return 10
    if unique_types >= 1:
        return 5
    return 0


def _score_length_mix(unique_categories: int) -> int:
    """Score based on number of distinct length categories."""
    if unique_categories >= 3:
        return CONFIDENCE_MAX_LENGTH_MIX  # 15
    if unique_categories >= 2:
        return 10
    if unique_categories >= 1:
        return 5
    return 0


def _score_consistency(dna_versions: list[Any]) -> int:
    """Score based on DNA prominence scores from the latest version."""
    if not dna_versions:
        return 0

    latest = max(dna_versions, key=lambda v: v.version_number)
    scores = latest.prominence_scores
    if not scores:
        return 0

    values = list(scores.values())
    if not values:
        return 0

    avg = sum(values) / len(values)
    return min(int(avg / 100 * CONFIDENCE_MAX_CONSISTENCY), CONFIDENCE_MAX_CONSISTENCY)


def calculate_confidence(clone: VoiceClone | Any) -> int:
    """Calculate a deterministic confidence score (0-100) for a voice clone."""
    samples = clone.samples
    total_words = sum(s.word_count for s in samples)
    sample_count = len(samples)
    unique_types = len({s.content_type for s in samples})
    unique_categories = len({s.length_category for s in samples if s.length_category})

    score = (
        _score_word_count(total_words)
        + _score_sample_count(sample_count)
        + _score_type_variety(unique_types)
        + _score_length_mix(unique_categories)
        + _score_consistency(clone.dna_versions)
    )

    return min(score, 100)
