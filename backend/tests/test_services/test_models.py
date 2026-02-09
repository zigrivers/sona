"""Tests for all SQLAlchemy models."""

from datetime import datetime

import nanoid
import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import MergedCloneSource, VoiceClone
from app.models.content import Content, ContentVersion
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings, MethodologyVersion
from app.models.preset import GenerationPreset
from app.models.sample import WritingSample

# --- VoiceClone ---


async def test_voice_clone_create_with_required_fields(session: AsyncSession) -> None:
    """VoiceClone should be creatable with required fields."""
    clone = VoiceClone(
        id=nanoid.generate(),
        name="Test Clone",
    )
    session.add(clone)
    await session.flush()

    result = await session.execute(select(VoiceClone).where(VoiceClone.id == clone.id))
    fetched = result.scalar_one()
    assert fetched.name == "Test Clone"
    assert fetched.type == "original"
    assert fetched.is_demo is False
    assert fetched.is_hidden is False
    assert fetched.description is None
    assert fetched.tags == []
    assert fetched.avatar_path is None
    assert isinstance(fetched.created_at, datetime)
    assert isinstance(fetched.updated_at, datetime)


async def test_voice_clone_relationships_load_samples(session: AsyncSession) -> None:
    """VoiceClone.samples relationship should load writing samples."""
    clone = VoiceClone(id=nanoid.generate(), name="With Samples")
    session.add(clone)
    await session.flush()

    sample = WritingSample(
        id=nanoid.generate(),
        clone_id=clone.id,
        content="Sample text for testing relationship loading.",
        content_type="blog_post",
        word_count=6,
        source_type="paste",
    )
    session.add(sample)
    await session.flush()

    result = await session.execute(select(VoiceClone).where(VoiceClone.id == clone.id))
    fetched = result.scalar_one()
    assert len(fetched.samples) == 1
    assert fetched.samples[0].content == "Sample text for testing relationship loading."


# --- WritingSample ---


async def test_writing_sample_belongs_to_clone(session: AsyncSession) -> None:
    """WritingSample should reference a clone via clone_id FK."""
    clone = VoiceClone(id=nanoid.generate(), name="Parent Clone")
    session.add(clone)
    await session.flush()

    sample = WritingSample(
        id=nanoid.generate(),
        clone_id=clone.id,
        content="A test writing sample.",
        content_type="email",
        word_count=5,
        source_type="paste",
    )
    session.add(sample)
    await session.flush()

    result = await session.execute(select(WritingSample).where(WritingSample.clone_id == clone.id))
    fetched = result.scalar_one()
    assert fetched.clone_id == clone.id
    assert fetched.content_type == "email"
    assert fetched.source_url is None
    assert fetched.source_filename is None


async def test_writing_sample_has_all_fields(session: AsyncSession) -> None:
    """WritingSample should support all optional fields."""
    clone = VoiceClone(id=nanoid.generate(), name="Clone")
    session.add(clone)
    await session.flush()

    sample = WritingSample(
        id=nanoid.generate(),
        clone_id=clone.id,
        content="Full sample text.",
        content_type="blog_post",
        content_type_detected="article",
        word_count=3,
        length_category="short",
        source_type="url",
        source_url="https://example.com",
        source_filename=None,
    )
    session.add(sample)
    await session.flush()

    result = await session.execute(select(WritingSample).where(WritingSample.id == sample.id))
    fetched = result.scalar_one()
    assert fetched.content_type_detected == "article"
    assert fetched.length_category == "short"
    assert fetched.source_url == "https://example.com"


# --- VoiceDNAVersion ---


async def test_voice_dna_version_stores_json_data(session: AsyncSession) -> None:
    """VoiceDNAVersion should store and retrieve JSON data."""
    clone = VoiceClone(id=nanoid.generate(), name="DNA Clone")
    session.add(clone)
    await session.flush()

    dna_data = {"vocabulary": {"complexity": "moderate"}, "tone": {"formality": "casual"}}
    dna = VoiceDNAVersion(
        id=nanoid.generate(),
        clone_id=clone.id,
        version_number=1,
        data=dna_data,
        trigger="analysis",
        model_used="gpt-4o",
    )
    session.add(dna)
    await session.flush()

    result = await session.execute(select(VoiceDNAVersion).where(VoiceDNAVersion.id == dna.id))
    fetched = result.scalar_one()
    assert fetched.data["vocabulary"]["complexity"] == "moderate"
    assert fetched.version_number == 1
    assert fetched.trigger == "analysis"
    assert fetched.model_used == "gpt-4o"


# --- Content & ContentVersion ---


async def test_content_has_version_history(session: AsyncSession) -> None:
    """Content should have associated ContentVersions."""
    clone = VoiceClone(id=nanoid.generate(), name="Content Clone")
    session.add(clone)
    await session.flush()

    content = Content(
        id=nanoid.generate(),
        clone_id=clone.id,
        platform="linkedin",
        status="draft",
        content_current="Current text",
        content_original="Original text",
        input_text="Write about testing",
        word_count=2,
        char_count=12,
    )
    session.add(content)
    await session.flush()

    version = ContentVersion(
        id=nanoid.generate(),
        content_id=content.id,
        version_number=1,
        content_text="Original text",
        trigger="generation",
        word_count=2,
    )
    session.add(version)
    await session.flush()

    result = await session.execute(select(Content).where(Content.id == content.id))
    fetched = result.scalar_one()
    assert len(fetched.versions) == 1
    assert fetched.versions[0].content_text == "Original text"
    assert fetched.content_current == "Current text"


async def test_content_has_all_fields(session: AsyncSession) -> None:
    """Content should support all fields including optional ones."""
    clone = VoiceClone(id=nanoid.generate(), name="Full Content Clone")
    session.add(clone)
    await session.flush()

    preset = GenerationPreset(
        id=nanoid.generate(),
        name="Test Preset",
        properties={"tone": "casual"},
    )
    session.add(preset)
    await session.flush()

    content = Content(
        id=nanoid.generate(),
        clone_id=clone.id,
        platform="twitter",
        status="published",
        content_current="Final text",
        content_original="Draft text",
        input_text="Write a tweet",
        generation_properties={"temperature": 0.7},
        authenticity_score=85,
        score_dimensions={"vocabulary": 90, "tone": 80},
        topic="testing",
        campaign="launch",
        tags=["test", "demo"],
        word_count=2,
        char_count=10,
        preset_id=preset.id,
    )
    session.add(content)
    await session.flush()

    result = await session.execute(select(Content).where(Content.id == content.id))
    fetched = result.scalar_one()
    assert fetched.authenticity_score == 85
    assert fetched.tags == ["test", "demo"]
    assert fetched.preset_id == preset.id
    assert fetched.generation_properties == {"temperature": 0.7}


# --- MergedCloneSource ---


async def test_merged_clone_source_links_clones(session: AsyncSession) -> None:
    """MergedCloneSource should link a merged clone to its source clones."""
    source1 = VoiceClone(id=nanoid.generate(), name="Source 1")
    source2 = VoiceClone(id=nanoid.generate(), name="Source 2")
    merged = VoiceClone(id=nanoid.generate(), name="Merged", type="merged")
    session.add_all([source1, source2, merged])
    await session.flush()

    link1 = MergedCloneSource(
        id=nanoid.generate(),
        merged_clone_id=merged.id,
        source_clone_id=source1.id,
        weights={"vocabulary": 0.7, "tone": 0.3},
    )
    link2 = MergedCloneSource(
        id=nanoid.generate(),
        merged_clone_id=merged.id,
        source_clone_id=source2.id,
        weights={"vocabulary": 0.3, "tone": 0.7},
    )
    session.add_all([link1, link2])
    await session.flush()

    result = await session.execute(
        select(MergedCloneSource).where(MergedCloneSource.merged_clone_id == merged.id)
    )
    sources = list(result.scalars().all())
    assert len(sources) == 2
    source_ids = {s.source_clone_id for s in sources}
    assert source_ids == {source1.id, source2.id}


# --- MethodologySettings ---


async def test_methodology_settings_unique_section_key(session: AsyncSession) -> None:
    """MethodologySettings.section_key should be unique."""
    settings1 = MethodologySettings(
        id=nanoid.generate(),
        section_key="voice_cloning",
        current_content="Instructions for voice cloning.",
    )
    session.add(settings1)
    await session.flush()

    settings2 = MethodologySettings(
        id=nanoid.generate(),
        section_key="voice_cloning",
        current_content="Duplicate key!",
    )
    session.add(settings2)
    with pytest.raises(IntegrityError):
        await session.flush()


async def test_methodology_settings_has_versions(session: AsyncSession) -> None:
    """MethodologySettings should have associated versions."""
    settings = MethodologySettings(
        id=nanoid.generate(),
        section_key="authenticity",
        current_content="Current guidelines.",
    )
    session.add(settings)
    await session.flush()

    version = MethodologyVersion(
        id=nanoid.generate(),
        settings_id=settings.id,
        version_number=1,
        content="Initial guidelines.",
        trigger="manual",
    )
    session.add(version)
    await session.flush()

    result = await session.execute(
        select(MethodologySettings).where(MethodologySettings.id == settings.id)
    )
    fetched = result.scalar_one()
    assert len(fetched.versions) == 1
    assert fetched.versions[0].content == "Initial guidelines."


# --- GenerationPreset ---


async def test_generation_preset_has_all_fields(session: AsyncSession) -> None:
    """GenerationPreset should store name, properties JSON, and timestamps."""
    preset = GenerationPreset(
        id=nanoid.generate(),
        name="Casual LinkedIn",
        properties={"tone": "casual", "length": "medium"},
    )
    session.add(preset)
    await session.flush()

    result = await session.execute(select(GenerationPreset).where(GenerationPreset.id == preset.id))
    fetched = result.scalar_one()
    assert fetched.name == "Casual LinkedIn"
    assert fetched.properties == {"tone": "casual", "length": "medium"}
    assert isinstance(fetched.created_at, datetime)


# --- Migration ---


async def test_all_tables_are_created(session: AsyncSession) -> None:
    """All 9 expected tables should exist after metadata.create_all."""
    result = await session.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    tables = {row[0] for row in result.fetchall()}

    expected_tables = {
        "voice_clones",
        "writing_samples",
        "voice_dna_versions",
        "content",
        "content_versions",
        "merged_clone_sources",
        "methodology_settings",
        "methodology_versions",
        "generation_presets",
    }
    assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"
