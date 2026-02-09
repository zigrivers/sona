"""Methodology settings and version models."""

from __future__ import annotations

from datetime import UTC, datetime

import nanoid
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MethodologySettings(Base):
    __tablename__ = "methodology_settings"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    section_key: Mapped[str] = mapped_column(String(100), unique=True)
    current_content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    versions: Mapped[list[MethodologyVersion]] = relationship(
        back_populates="settings",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class MethodologyVersion(Base):
    __tablename__ = "methodology_versions"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    settings_id: Mapped[str] = mapped_column(
        String(21), ForeignKey("methodology_settings.id"), index=True
    )
    version_number: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    trigger: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    settings: Mapped[MethodologySettings] = relationship(back_populates="versions")
