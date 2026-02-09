"""Writing sample model."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.clone import VoiceClone


class WritingSample(Base):
    __tablename__ = "writing_samples"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    clone_id: Mapped[str] = mapped_column(String(21), ForeignKey("voice_clones.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    content_type: Mapped[str] = mapped_column(String(50))
    content_type_detected: Mapped[str | None] = mapped_column(String(50), default=None)
    word_count: Mapped[int] = mapped_column(Integer)
    length_category: Mapped[str | None] = mapped_column(String(20), default=None)
    source_type: Mapped[str] = mapped_column(String(20))
    source_url: Mapped[str | None] = mapped_column(String(2000), default=None)
    source_filename: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    clone: Mapped[VoiceClone] = relationship(back_populates="samples")
