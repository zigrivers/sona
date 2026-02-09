"""Voice DNA version model."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.clone import VoiceClone


class VoiceDNAVersion(Base):
    __tablename__ = "voice_dna_versions"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    clone_id: Mapped[str] = mapped_column(String(21), ForeignKey("voice_clones.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    prominence_scores: Mapped[dict | None] = mapped_column(JSON, default=None)  # type: ignore[type-arg]
    trigger: Mapped[str] = mapped_column(String(50))
    model_used: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    clone: Mapped[VoiceClone] = relationship(back_populates="dna_versions")
