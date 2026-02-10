"""Tests for AI detection service."""

import json
from typing import Any
from unittest.mock import AsyncMock

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ContentNotFoundError
from app.models.clone import VoiceClone
from app.models.content import Content
from app.services.detection_service import DetectionService


def _make_detection_response(
    *,
    risk_level: str = "medium",
    confidence: int = 72,
    flagged: list[dict[str, str]] | None = None,
    summary: str = "Some passages show AI-like patterns.",
) -> str:
    """Build a fake LLM JSON response for detection."""
    if flagged is None:
        flagged = [
            {
                "text": "Furthermore, it is important to note",
                "reason": "Generic transitional phrase common in AI output",
                "suggestion": "Replace with a more natural transition",
            },
        ]
    return json.dumps(
        {
            "risk_level": risk_level,
            "confidence": confidence,
            "flagged_passages": flagged,
            "summary": summary,
        }
    )


async def _create_clone(session: AsyncSession) -> VoiceClone:
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.flush()
    return clone


async def _create_content(session: AsyncSession, clone_id: str) -> Content:
    content = Content(
        id=nanoid.generate(),
        clone_id=clone_id,
        platform="blog",
        status="draft",
        content_current="This is content to analyze for AI detection.",
        content_original="This is content to analyze for AI detection.",
        input_text="Write a blog post.",
        word_count=8,
        char_count=46,
    )
    session.add(content)
    await session.flush()
    return content


class TestDetectionService:
    async def test_detect_returns_risk_level(self, session: AsyncSession) -> None:
        """detect() should return a valid risk level."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_detection_response(risk_level="high"))

        service = DetectionService(session, mock_provider)
        result = await service.detect(content.id)

        assert result.risk_level == "high"

    async def test_detect_returns_confidence(self, session: AsyncSession) -> None:
        """detect() should return a confidence score."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_detection_response(confidence=85))

        service = DetectionService(session, mock_provider)
        result = await service.detect(content.id)

        assert result.confidence == 85

    async def test_detect_returns_flagged_passages(self, session: AsyncSession) -> None:
        """detect() should return a list of flagged passages."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        flagged = [
            {
                "text": "In conclusion",
                "reason": "Cliché closer",
                "suggestion": "Use a more natural ending",
            },
            {
                "text": "It is worth noting",
                "reason": "Filler phrase",
                "suggestion": "Remove or rephrase directly",
            },
        ]
        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_detection_response(flagged=flagged))

        service = DetectionService(session, mock_provider)
        result = await service.detect(content.id)

        assert len(result.flagged_passages) == 2

    async def test_flagged_passage_has_reason_and_suggestion(self, session: AsyncSession) -> None:
        """Each flagged passage should have text, reason, and suggestion."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value=_make_detection_response())

        service = DetectionService(session, mock_provider)
        result = await service.detect(content.id)

        passage = result.flagged_passages[0]
        assert passage.text == "Furthermore, it is important to note"
        assert passage.reason == "Generic transitional phrase common in AI output"
        assert passage.suggestion == "Replace with a more natural transition"

    async def test_detect_content_not_found(self, session: AsyncSession) -> None:
        """detect() should raise ContentNotFoundError for missing content."""
        mock_provider = AsyncMock()
        service = DetectionService(session, mock_provider)

        with pytest.raises(ContentNotFoundError):
            await service.detect("nonexistent-id")

    async def test_detect_prompt_includes_content(self, session: AsyncSession) -> None:
        """The detection prompt should include the content text."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return _make_detection_response()

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = DetectionService(session, mock_provider)
        await service.detect(content.id)

        assert len(captured_messages) == 1
        full_prompt = " ".join(m["content"] for m in captured_messages[0])
        assert "This is content to analyze for AI detection." in full_prompt

    async def test_detect_returns_summary(self, session: AsyncSession) -> None:
        """detect() should return a summary string."""
        clone = await _create_clone(session)
        content = await _create_content(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(
            return_value=_make_detection_response(summary="Text appears mostly human-written.")
        )

        service = DetectionService(session, mock_provider)
        result = await service.detect(content.id)

        assert result.summary == "Text appears mostly human-written."
