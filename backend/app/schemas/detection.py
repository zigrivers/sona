"""AI detection analysis schemas."""

from pydantic import BaseModel


class FlaggedPassage(BaseModel):
    text: str
    reason: str
    suggestion: str


class DetectionResponse(BaseModel):
    risk_level: str
    confidence: int
    flagged_passages: list[FlaggedPassage]
    summary: str
