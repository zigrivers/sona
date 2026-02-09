"""Voice clone and merged clone source models."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import nanoid
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.content import Content
    from app.models.dna import VoiceDNAVersion
    from app.models.sample import WritingSample


class VoiceClone(Base):
    __tablename__ = "voice_clones"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    tags: Mapped[list] = mapped_column(JSON, default=list)  # type: ignore[type-arg]
    type: Mapped[str] = mapped_column(String(20), default="original")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_path: Mapped[str | None] = mapped_column(String(500), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    samples: Mapped[list[WritingSample]] = relationship(
        back_populates="clone",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    dna_versions: Mapped[list[VoiceDNAVersion]] = relationship(
        back_populates="clone",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    content_items: Mapped[list[Content]] = relationship(
        back_populates="clone",
        lazy="noload",
        cascade="all, delete-orphan",
    )


class MergedCloneSource(Base):
    __tablename__ = "merged_clone_sources"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    merged_clone_id: Mapped[str] = mapped_column(String(21), ForeignKey("voice_clones.id"))
    source_clone_id: Mapped[str] = mapped_column(String(21), ForeignKey("voice_clones.id"))
    weights: Mapped[dict] = mapped_column(JSON, default=dict)  # type: ignore[type-arg]
