"""Methodology settings service — CRUD with versioning and pruning."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import MAX_METHODOLOGY_VERSIONS
from app.models.methodology import MethodologySettings, MethodologyVersion


class MethodologyService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_section(self, section_key: str) -> MethodologySettings | None:
        """Return the methodology settings for a section, or None."""
        stmt = select(MethodologySettings).where(MethodologySettings.section_key == section_key)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_section(self, section_key: str, content: str) -> MethodologySettings:
        """Update section content, creating a new version if changed."""
        settings = await self.get_section(section_key)
        if settings is None:
            msg = f"Methodology section '{section_key}' not found"
            raise ValueError(msg)

        if settings.current_content == content:
            return settings

        settings.current_content = content

        next_version = await self._next_version_number(settings.id)
        version = MethodologyVersion(
            settings_id=settings.id,
            version_number=next_version,
            content=content,
            trigger="manual_edit",
        )
        self._session.add(version)
        await self._session.flush()

        await self._prune_versions(settings.id)
        return settings

    async def list_versions(self, section_key: str, *, limit: int = 10) -> list[MethodologyVersion]:
        """Return up to `limit` versions for a section, newest first."""
        settings = await self.get_section(section_key)
        if settings is None:
            return []

        stmt = (
            select(MethodologyVersion)
            .where(MethodologyVersion.settings_id == settings.id)
            .order_by(MethodologyVersion.version_number.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def revert(self, section_key: str, target_version: int) -> MethodologySettings:
        """Revert section to a previous version (creates a new version)."""
        settings = await self.get_section(section_key)
        if settings is None:
            msg = f"Methodology section '{section_key}' not found"
            raise ValueError(msg)

        stmt = select(MethodologyVersion).where(
            MethodologyVersion.settings_id == settings.id,
            MethodologyVersion.version_number == target_version,
        )
        result = await self._session.execute(stmt)
        old_version = result.scalar_one_or_none()
        if old_version is None:
            msg = f"Version {target_version} not found for section '{section_key}'"
            raise ValueError(msg)

        settings.current_content = old_version.content

        next_version = await self._next_version_number(settings.id)
        version = MethodologyVersion(
            settings_id=settings.id,
            version_number=next_version,
            content=old_version.content,
            trigger="revert",
        )
        self._session.add(version)
        await self._session.flush()

        await self._prune_versions(settings.id)
        return settings

    # ── Helpers ────────────────────────────────────────────────────

    async def _next_version_number(self, settings_id: str) -> int:
        """Return the next version number for a settings record."""
        stmt = (
            select(MethodologyVersion.version_number)
            .where(MethodologyVersion.settings_id == settings_id)
            .order_by(MethodologyVersion.version_number.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def _prune_versions(self, settings_id: str) -> None:
        """Delete oldest versions if count exceeds MAX_METHODOLOGY_VERSIONS."""
        stmt = (
            select(MethodologyVersion)
            .where(MethodologyVersion.settings_id == settings_id)
            .order_by(MethodologyVersion.version_number.desc())
        )
        result = await self._session.execute(stmt)
        versions = list(result.scalars().all())

        if len(versions) > MAX_METHODOLOGY_VERSIONS:
            for v in versions[MAX_METHODOLOGY_VERSIONS:]:
                await self._session.delete(v)
            await self._session.flush()
