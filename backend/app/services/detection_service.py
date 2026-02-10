"""AI detection analysis service."""

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ContentNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_detection_prompt
from app.models.content import Content
from app.schemas.detection import DetectionResponse, FlaggedPassage


class DetectionService:
    def __init__(self, session: AsyncSession, provider: LLMProvider) -> None:
        self._session = session
        self._provider = provider

    async def detect(self, content_id: str) -> DetectionResponse:
        """Analyze content for AI-detectable signals.

        Raises:
            ContentNotFoundError: If content doesn't exist.
        """
        content = await self._get_content(content_id)

        messages = build_detection_prompt(content.content_current)
        response = await self._provider.complete(messages, temperature=0.3)

        parsed = json.loads(response)

        return DetectionResponse(
            risk_level=parsed["risk_level"],
            confidence=parsed["confidence"],
            flagged_passages=[FlaggedPassage(**p) for p in parsed["flagged_passages"]],
            summary=parsed["summary"],
        )

    async def _get_content(self, content_id: str) -> Content:
        result = await self._session.execute(select(Content).where(Content.id == content_id))
        content = result.scalar_one_or_none()
        if content is None:
            raise ContentNotFoundError(content_id)
        return content
