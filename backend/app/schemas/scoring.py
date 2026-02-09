"""Authenticity scoring schemas."""

from pydantic import BaseModel


class DimensionScore(BaseModel):
    name: str
    score: int
    feedback: str


class AuthenticityScoreResponse(BaseModel):
    overall_score: int
    dimensions: list[DimensionScore]
