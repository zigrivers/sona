"""Content and content version models."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.clone import VoiceClone


class Content(Base):
    __tablename__ = "content"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    clone_id: Mapped[str] = mapped_column(String(21), ForeignKey("voice_clones.id"), index=True)
    platform: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20))
    content_current: Mapped[str] = mapped_column(Text)
    content_original: Mapped[str] = mapped_column(Text)
    input_text: Mapped[str] = mapped_column(Text)
    generation_properties: Mapped[dict | None] = mapped_column(JSON, default=None)  # type: ignore[type-arg]
    authenticity_score: Mapped[int | None] = mapped_column(Integer, default=None)
    score_dimensions: Mapped[dict | None] = mapped_column(JSON, default=None)  # type: ignore[type-arg]
    topic: Mapped[str | None] = mapped_column(String(200), default=None)
    campaign: Mapped[str | None] = mapped_column(String(200), default=None)
    tags: Mapped[list] = mapped_column(JSON, default=list)  # type: ignore[type-arg]
    word_count: Mapped[int] = mapped_column(Integer)
    char_count: Mapped[int] = mapped_column(Integer)
    preset_id: Mapped[str | None] = mapped_column(
        String(21), ForeignKey("generation_presets.id"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    clone: Mapped[VoiceClone] = relationship(back_populates="content_items")
    versions: Mapped[list[ContentVersion]] = relationship(
        back_populates="content",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class ContentVersion(Base):
    __tablename__ = "content_versions"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    content_id: Mapped[str] = mapped_column(String(21), ForeignKey("content.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    content_text: Mapped[str] = mapped_column(Text)
    trigger: Mapped[str] = mapped_column(String(50))
    word_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    content: Mapped[Content] = relationship(back_populates="versions")
