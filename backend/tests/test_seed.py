"""Tests for methodology seed defaults and demo voice clones."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings, MethodologyVersion
from app.models.sample import WritingSample
from app.seed import SECTION_KEYS, seed_demo_clones, seed_methodology_defaults


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


# ── Demo voice clone tests ────────────────────────────────────────


class TestSeedDemoClones:
    async def test_creates_three_demo_clones(self, session: AsyncSession) -> None:
        """seed_demo_clones creates exactly 3 demo clones."""
        await seed_demo_clones(session)

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        assert len(clones) == 3
        names = {c.name for c in clones}
        assert names == {"Professional Blogger", "Casual Social", "Technical Writer"}

    async def test_seed_idempotent(self, session: AsyncSession) -> None:
        """Running seed_demo_clones twice does not duplicate clones."""
        await seed_demo_clones(session)
        await seed_demo_clones(session)

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        assert len(clones) == 3

    async def test_demo_clones_have_samples(self, session: AsyncSession) -> None:
        """Each demo clone has 3-5 writing samples."""
        await seed_demo_clones(session)

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        for clone in clones:
            stmt = select(WritingSample).where(WritingSample.clone_id == clone.id)
            result = await session.execute(stmt)
            samples = list(result.scalars().all())
            assert 3 <= len(samples) <= 5, (
                f"Clone '{clone.name}' has {len(samples)} samples, expected 3-5"
            )
            for sample in samples:
                assert sample.word_count > 0
                assert sample.source_type == "paste"
                assert sample.content_type == "text/plain"

    async def test_demo_clones_have_dna(self, session: AsyncSession) -> None:
        """Each demo clone has a VoiceDNAVersion with all 9 dimensions."""
        await seed_demo_clones(session)

        dimensions = [
            "vocabulary",
            "sentence_structure",
            "paragraph_structure",
            "tone",
            "rhetorical_devices",
            "punctuation",
            "openings_and_closings",
            "humor",
            "signatures",
        ]

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        for clone in clones:
            stmt = select(VoiceDNAVersion).where(VoiceDNAVersion.clone_id == clone.id)
            result = await session.execute(stmt)
            dna_versions = list(result.scalars().all())
            assert len(dna_versions) == 1, (
                f"Clone '{clone.name}' has {len(dna_versions)} DNA versions, expected 1"
            )
            dna = dna_versions[0]
            for dim in dimensions:
                assert dim in dna.data, f"DNA for '{clone.name}' missing dimension '{dim}'"

    async def test_demo_clones_have_prominence_scores(self, session: AsyncSession) -> None:
        """Each demo clone DNA has prominence scores for all 9 dimensions, all >= 80."""
        await seed_demo_clones(session)

        dimensions = [
            "vocabulary",
            "sentence_structure",
            "paragraph_structure",
            "tone",
            "rhetorical_devices",
            "punctuation",
            "openings_and_closings",
            "humor",
            "signatures",
        ]

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        for clone in clones:
            stmt = select(VoiceDNAVersion).where(VoiceDNAVersion.clone_id == clone.id)
            result = await session.execute(stmt)
            dna = result.scalar_one()
            assert dna.prominence_scores is not None
            for dim in dimensions:
                score = dna.prominence_scores[dim]
                assert score >= 80, f"Clone '{clone.name}' dimension '{dim}' score {score} < 80"

    async def test_demo_clone_is_demo_flag_true(self, session: AsyncSession) -> None:
        """All seeded demo clones have is_demo=True."""
        await seed_demo_clones(session)

        stmt = select(VoiceClone).where(VoiceClone.is_demo.is_(True))
        result = await session.execute(stmt)
        clones = list(result.scalars().all())

        for clone in clones:
            assert clone.is_demo is True
