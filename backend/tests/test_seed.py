"""Tests for methodology seed defaults."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.methodology import MethodologySettings, MethodologyVersion
from app.seed import SECTION_KEYS, seed_methodology_defaults


class TestSeedCreation:
    async def test_creates_three_sections(self, session: AsyncSession) -> None:
        """seed_methodology_defaults creates all 3 sections."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings)
        result = await session.execute(stmt)
        sections = list(result.scalars().all())

        assert len(sections) == 3
        keys = {s.section_key for s in sections}
        assert keys == {"voice_cloning", "authenticity", "platform_practices"}

    async def test_each_section_has_version_1(self, session: AsyncSession) -> None:
        """Each seeded section has exactly one version with trigger='seed'."""
        await seed_methodology_defaults(session)

        for key in SECTION_KEYS:
            stmt = select(MethodologySettings).where(MethodologySettings.section_key == key)
            result = await session.execute(stmt)
            settings = result.scalar_one()

            stmt = select(MethodologyVersion).where(MethodologyVersion.settings_id == settings.id)
            result = await session.execute(stmt)
            versions = list(result.scalars().all())

            assert len(versions) == 1
            assert versions[0].version_number == 1
            assert versions[0].trigger == "seed"


class TestIdempotency:
    async def test_idempotent_on_second_run(self, session: AsyncSession) -> None:
        """Running seed twice does not duplicate sections."""
        await seed_methodology_defaults(session)
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings)
        result = await session.execute(stmt)
        sections = list(result.scalars().all())

        assert len(sections) == 3


class TestVoiceCloningContent:
    async def test_covers_nine_dimensions(self, session: AsyncSession) -> None:
        """Voice cloning content mentions all 9 analysis dimensions."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(MethodologySettings.section_key == "voice_cloning")
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        dimensions = [
            "vocabulary",
            "sentence structure",
            "paragraph",
            "tone",
            "rhetorical",
            "punctuation",
            "openings",
            "closings",
            "humor",
            "signature",
        ]
        for dim in dimensions:
            assert dim in content, f"Voice cloning content missing '{dim}'"

    async def test_covers_prominence_scores(self, session: AsyncSession) -> None:
        """Voice cloning content mentions prominence scoring."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(MethodologySettings.section_key == "voice_cloning")
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        assert "prominence" in content
        assert "0" in content and "100" in content

    async def test_covers_json_output(self, session: AsyncSession) -> None:
        """Voice cloning content mentions structured JSON output."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(MethodologySettings.section_key == "voice_cloning")
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        assert "json" in content


class TestAuthenticityContent:
    async def test_covers_ai_tells(self, session: AsyncSession) -> None:
        """Authenticity content covers AI tell avoidance."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(MethodologySettings.section_key == "authenticity")
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        indicators = ["ai tell", "transition", "hedging", "generic"]
        found = sum(1 for i in indicators if i in content)
        assert found >= 2, f"Authenticity content should mention AI tells, found: {found}"

    async def test_covers_voice_elements(self, session: AsyncSession) -> None:
        """Authenticity content covers voice element incorporation."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(MethodologySettings.section_key == "authenticity")
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        elements = ["contraction", "punctuation", "vocabulary"]
        found = sum(1 for e in elements if e in content)
        assert found >= 2, f"Authenticity content should cover voice elements, found: {found}"


class TestPlatformContent:
    async def test_covers_all_platforms(self, session: AsyncSession) -> None:
        """Platform practices content covers all required platforms."""
        await seed_methodology_defaults(session)

        stmt = select(MethodologySettings).where(
            MethodologySettings.section_key == "platform_practices"
        )
        result = await session.execute(stmt)
        settings = result.scalar_one()
        content = settings.current_content.lower()

        platforms = [
            "linkedin",
            "twitter",
            "facebook",
            "instagram",
            "blog",
            "email",
            "newsletter",
            "sms",
        ]
        for platform in platforms:
            assert platform in content, f"Platform content missing '{platform}'"
