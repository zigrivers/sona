"""Generation preset model."""

from datetime import UTC, datetime

import nanoid
from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GenerationPreset(Base):
    __tablename__ = "generation_presets"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=nanoid.generate)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict)  # type: ignore[type-arg]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
