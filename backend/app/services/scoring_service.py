"""Confidence scoring algorithm and authenticity scoring service for voice clones."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    CONFIDENCE_MAX_CONSISTENCY,
    CONFIDENCE_MAX_LENGTH_MIX,
    CONFIDENCE_MAX_SAMPLE_COUNT,
    CONFIDENCE_MAX_TYPE_VARIETY,
    CONFIDENCE_MAX_WORD_COUNT,
)
from app.exceptions import ContentNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_scoring_prompt
from app.models.content import Content
from app.models.dna import VoiceDNAVersion

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
    """Score based on LLM-rated consistency_score, falling back to prominence avg."""
    if not dna_versions:
        return 0

    latest = max(dna_versions, key=lambda v: v.version_number)

    # Prefer explicit consistency_score from DNA data
    consistency_score = latest.data.get("consistency_score") if latest.data else None
    if consistency_score is not None:
        return min(
            int(consistency_score * CONFIDENCE_MAX_CONSISTENCY / 100),
            CONFIDENCE_MAX_CONSISTENCY,
        )

    # Fallback: average prominence scores (backwards compat with pre-existing DNA)
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


class ScoringService:
    def __init__(self, session: AsyncSession, provider: LLMProvider) -> None:
        self._session = session
        self._provider = provider

    async def score(self, content_id: str) -> Content:
        """Score content for voice authenticity across 8 dimensions.

        Raises:
            ContentNotFoundError: If content doesn't exist.
            ValueError: If clone has no DNA.
        """
        content = await self._get_content(content_id)
        dna = await self._get_latest_dna(content.clone_id)

        raw_data = cast(dict[str, Any], dna.data)  # pyright: ignore[reportUnknownMemberType]
        dna_json = json.dumps(raw_data)

        messages = build_scoring_prompt(dna_json=dna_json, content_text=content.content_current)
        response = await self._provider.complete(messages, temperature=0.3)

        parsed = json.loads(response)
        dimensions: list[dict[str, Any]] = parsed["dimensions"]

        scores = [d["score"] for d in dimensions]
        overall = round(sum(scores) / len(scores))

        content.authenticity_score = overall
        content.score_dimensions = {"dimensions": dimensions}
        await self._session.flush()

        return content

    async def _get_content(self, content_id: str) -> Content:
        result = await self._session.execute(select(Content).where(Content.id == content_id))
        content = result.scalar_one_or_none()
        if content is None:
            raise ContentNotFoundError(content_id)
        return content

    async def _get_latest_dna(self, clone_id: str) -> VoiceDNAVersion:
        result = await self._session.execute(
            select(VoiceDNAVersion)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
            .limit(1)
        )
        dna = result.scalar_one_or_none()
        if dna is None:
            msg = "Analyze Voice DNA before scoring content"
            raise ValueError(msg)
        return dna
