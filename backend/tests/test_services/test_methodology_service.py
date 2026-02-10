"""Tests for methodology service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.methodology import MethodologySettings, MethodologyVersion
from app.services.methodology_service import MethodologyService

VALID_SECTIONS = ["voice_cloning", "authenticity", "platform_practices"]


async def _seed_section(
    session: AsyncSession,
    section_key: str = "voice_cloning",
    content: str = "Analyze voice patterns.",
) -> MethodologySettings:
    """Create a methodology settings row with version 1."""
    settings = MethodologySettings(
        section_key=section_key,
        current_content=content,
    )
    session.add(settings)
    await session.flush()

    version = MethodologyVersion(
        settings_id=settings.id,
        version_number=1,
        content=content,
        trigger="seed",
    )
    session.add(version)
    await session.flush()
    return settings


class TestGetSection:
    async def test_returns_existing_section(self, session: AsyncSession) -> None:
        """get_section returns the methodology settings for a valid section key."""
        seed = await _seed_section(session)
        svc = MethodologyService(session)

        result = await svc.get_section("voice_cloning")

        assert result is not None
        assert result.id == seed.id
        assert result.section_key == "voice_cloning"
        assert result.current_content == "Analyze voice patterns."

    async def test_returns_none_for_missing_section(self, session: AsyncSession) -> None:
        """get_section returns None when section does not exist."""
        svc = MethodologyService(session)

        result = await svc.get_section("nonexistent")

        assert result is None


class TestUpdateSection:
    async def test_creates_new_version(self, session: AsyncSession) -> None:
        """update_section creates a new version when content changes."""
        await _seed_section(session, content="Old content")
        svc = MethodologyService(session)

        result = await svc.update_section("voice_cloning", "New content")

        assert result.current_content == "New content"
        # Verify new version was created
        versions = await svc.list_versions("voice_cloning")
        assert len(versions) == 2
        assert versions[0].version_number == 2
        assert versions[0].content == "New content"
        assert versions[0].trigger == "manual_edit"

    async def test_no_new_version_when_unchanged(self, session: AsyncSession) -> None:
        """update_section skips version creation when content is unchanged."""
        await _seed_section(session, content="Same content")
        svc = MethodologyService(session)

        result = await svc.update_section("voice_cloning", "Same content")

        assert result.current_content == "Same content"
        versions = await svc.list_versions("voice_cloning")
        assert len(versions) == 1

    async def test_raises_for_missing_section(self, session: AsyncSession) -> None:
        """update_section raises ValueError for non-existent section."""
        svc = MethodologyService(session)

        with pytest.raises(ValueError, match="not found"):
            await svc.update_section("nonexistent", "content")


class TestListVersions:
    async def test_returns_versions_descending(self, session: AsyncSession) -> None:
        """list_versions returns versions ordered by version_number desc."""
        seed = await _seed_section(session)
        # Add more versions
        for i in range(2, 5):
            v = MethodologyVersion(
                settings_id=seed.id,
                version_number=i,
                content=f"Version {i}",
                trigger="manual_edit",
            )
            session.add(v)
        await session.flush()

        svc = MethodologyService(session)
        versions = await svc.list_versions("voice_cloning")

        assert len(versions) == 4
        assert versions[0].version_number == 4
        assert versions[-1].version_number == 1

    async def test_returns_max_10_versions(self, session: AsyncSession) -> None:
        """list_versions returns at most 10 versions."""
        seed = await _seed_section(session)
        for i in range(2, 15):
            v = MethodologyVersion(
                settings_id=seed.id,
                version_number=i,
                content=f"Version {i}",
                trigger="manual_edit",
            )
            session.add(v)
        await session.flush()

        svc = MethodologyService(session)
        versions = await svc.list_versions("voice_cloning")

        assert len(versions) == 10

    async def test_returns_empty_for_missing_section(self, session: AsyncSession) -> None:
        """list_versions returns empty list for non-existent section."""
        svc = MethodologyService(session)
        versions = await svc.list_versions("nonexistent")
        assert versions == []


class TestRevert:
    async def test_creates_new_version_with_old_content(self, session: AsyncSession) -> None:
        """revert creates a new version containing the reverted content."""
        await _seed_section(session, content="v1 content")
        svc = MethodologyService(session)
        await svc.update_section("voice_cloning", "v2 content")

        result = await svc.revert("voice_cloning", 1)

        assert result.current_content == "v1 content"
        versions = await svc.list_versions("voice_cloning")
        assert versions[0].version_number == 3
        assert versions[0].content == "v1 content"
        assert versions[0].trigger == "revert"

    async def test_raises_for_missing_version(self, session: AsyncSession) -> None:
        """revert raises ValueError when target version does not exist."""
        await _seed_section(session)
        svc = MethodologyService(session)

        with pytest.raises(ValueError, match="not found"):
            await svc.revert("voice_cloning", 999)

    async def test_raises_for_missing_section(self, session: AsyncSession) -> None:
        """revert raises ValueError when section does not exist."""
        svc = MethodologyService(session)

        with pytest.raises(ValueError, match="not found"):
            await svc.revert("nonexistent", 1)


class TestPrune:
    async def test_prunes_oldest_when_exceeds_limit(self, session: AsyncSession) -> None:
        """Creating versions beyond MAX_METHODOLOGY_VERSIONS prunes the oldest."""
        seed = await _seed_section(session)
        # Add versions 2..11 (total: 11, exceeds limit of 10)
        for i in range(2, 12):
            v = MethodologyVersion(
                settings_id=seed.id,
                version_number=i,
                content=f"Version {i}",
                trigger="manual_edit",
            )
            session.add(v)
        await session.flush()

        svc = MethodologyService(session)
        # Trigger prune by updating
        await svc.update_section("voice_cloning", "Version 12")

        versions = await svc.list_versions("voice_cloning")
        # Should be exactly 10 after pruning
        assert len(versions) == 10
        # Oldest should be version 3 (version 1 and 2 pruned)
        assert versions[-1].version_number == 3
