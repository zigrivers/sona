"""Schemas for database stats, backup, and restore endpoints."""

from pydantic import BaseModel


class DatabaseStatsResponse(BaseModel):
    """Database statistics including file size and record counts."""

    db_location: str
    db_size_bytes: int
    clone_count: int
    content_count: int
    sample_count: int


class RestoreResponse(BaseModel):
    """Response after restoring a database backup."""

    success: bool
    message: str
    stats: DatabaseStatsResponse
