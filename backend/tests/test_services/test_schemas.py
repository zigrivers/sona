"""Tests for all Pydantic request/response schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.clone import CloneCreate, CloneListResponse, CloneResponse, CloneUpdate
from app.schemas.content import (
    ContentCreate,
    ContentListResponse,
    ContentResponse,
    ContentUpdate,
    GenerateRequest,
)
from app.schemas.dna import DNAResponse, DNAVersionListResponse, DNAVersionResponse
from app.schemas.methodology import (
    MethodologyResponse,
    MethodologyUpdate,
    MethodologyVersionResponse,
)
from app.schemas.preset import PresetCreate, PresetResponse, PresetUpdate
from app.schemas.provider import ProviderResponse, ProviderTestResponse, ProviderUpdate
from app.schemas.sample import SampleCreate, SampleListResponse, SampleResponse
from app.schemas.scoring import AuthenticityScoreResponse, DimensionScore

# --- CloneCreate ---


def test_clone_create_requires_name() -> None:
    """CloneCreate should require a name field."""
    clone = CloneCreate(name="My Clone")
    assert clone.name == "My Clone"


def test_clone_create_rejects_empty_name() -> None:
    """CloneCreate should reject an empty name."""
    with pytest.raises(ValidationError):
        CloneCreate(name="")


def test_clone_create_has_optional_fields() -> None:
    """CloneCreate should accept optional description and tags."""
    clone = CloneCreate(name="Test", description="A description", tags=["tag1", "tag2"])
    assert clone.description == "A description"
    assert clone.tags == ["tag1", "tag2"]


def test_clone_create_defaults() -> None:
    """CloneCreate should default tags to empty list and description to None."""
    clone = CloneCreate(name="Test")
    assert clone.description is None
    assert clone.tags == []


# --- CloneUpdate ---


def test_clone_update_all_optional() -> None:
    """CloneUpdate should allow all fields to be optional."""
    update = CloneUpdate()
    assert update.name is None
    assert update.description is None
    assert update.tags is None


# --- CloneResponse ---


def test_clone_response_from_orm() -> None:
    """CloneResponse should have from_attributes=True for ORM mapping."""
    data = {
        "id": "abc123",
        "name": "Test Clone",
        "description": None,
        "tags": [],
        "type": "original",
        "is_demo": False,
        "is_hidden": False,
        "avatar_path": None,
        "confidence_score": 0,
        "sample_count": 0,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    response = CloneResponse.model_validate(data)
    assert response.id == "abc123"
    assert response.name == "Test Clone"
    assert response.type == "original"


# --- CloneListResponse ---


def test_clone_list_response_structure() -> None:
    """CloneListResponse should have items and total."""
    response = CloneListResponse(items=[], total=0)
    assert response.items == []
    assert response.total == 0


# --- ContentCreate ---


def test_content_create_validates_platform() -> None:
    """ContentCreate should accept valid platform values."""
    content = ContentCreate(
        clone_id="abc",
        platform="linkedin",
        input_text="Write something",
    )
    assert content.platform == "linkedin"


def test_content_create_rejects_invalid_platform() -> None:
    """ContentCreate should reject invalid platform values."""
    with pytest.raises(ValidationError):
        ContentCreate(
            clone_id="abc",
            platform="tiktok",
            input_text="Write something",
        )


# --- ContentUpdate ---


def test_content_update_all_optional() -> None:
    """ContentUpdate should allow all fields to be optional."""
    update = ContentUpdate()
    assert update.content_current is None


# --- ContentResponse ---


def test_content_response_structure() -> None:
    """ContentResponse should map all content fields."""
    data = {
        "id": "content-1",
        "clone_id": "clone-1",
        "platform": "twitter",
        "status": "draft",
        "content_current": "Current text",
        "content_original": "Original text",
        "input_text": "Input",
        "generation_properties": None,
        "authenticity_score": None,
        "score_dimensions": None,
        "topic": None,
        "campaign": None,
        "tags": [],
        "word_count": 2,
        "char_count": 12,
        "preset_id": None,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    response = ContentResponse.model_validate(data)
    assert response.platform == "twitter"
    assert response.status == "draft"


# --- ContentListResponse ---


def test_content_list_response() -> None:
    """ContentListResponse should have items and total."""
    response = ContentListResponse(items=[], total=0)
    assert response.total == 0


# --- GenerateRequest ---


def test_generate_request_requires_clone_id_and_platform() -> None:
    """GenerateRequest should require clone_id, platform, and input_text."""
    req = GenerateRequest(
        clone_id="abc",
        platform="linkedin",
        input_text="Write about testing",
    )
    assert req.clone_id == "abc"
    assert req.platform == "linkedin"


def test_generate_request_rejects_missing_clone_id() -> None:
    """GenerateRequest should fail without clone_id."""
    with pytest.raises(ValidationError):
        GenerateRequest(platform="linkedin", input_text="Test")  # type: ignore[call-arg]


# --- SampleCreate ---


def test_sample_create_paste_requires_content() -> None:
    """SampleCreate with source_type 'paste' should require content."""
    sample = SampleCreate(
        content="Some pasted text for analysis.",
        content_type="blog_post",
        source_type="paste",
    )
    assert sample.content == "Some pasted text for analysis."


def test_sample_create_rejects_empty_content_for_paste() -> None:
    """SampleCreate with source_type 'paste' should reject empty content."""
    with pytest.raises(ValidationError):
        SampleCreate(
            content="",
            content_type="blog_post",
            source_type="paste",
        )


# --- SampleResponse ---


def test_sample_response_structure() -> None:
    """SampleResponse should include all fields."""
    data = {
        "id": "sample-1",
        "clone_id": "clone-1",
        "content": "Sample text",
        "content_type": "blog_post",
        "content_type_detected": None,
        "word_count": 2,
        "length_category": None,
        "source_type": "paste",
        "source_url": None,
        "source_filename": None,
        "created_at": "2026-01-01T00:00:00",
    }
    response = SampleResponse.model_validate(data)
    assert response.id == "sample-1"
    assert response.source_type == "paste"


# --- SampleListResponse ---


def test_sample_list_response() -> None:
    """SampleListResponse should have items and total."""
    response = SampleListResponse(items=[], total=0)
    assert response.total == 0


# --- DNAResponse ---


def test_dna_response_structure() -> None:
    """DNAResponse should map DNA data."""
    data = {
        "id": "dna-1",
        "clone_id": "clone-1",
        "version_number": 1,
        "data": {"vocabulary": {"complexity": "moderate"}},
        "prominence_scores": None,
        "trigger": "analysis",
        "model_used": "gpt-4o",
        "created_at": "2026-01-01T00:00:00",
    }
    response = DNAResponse.model_validate(data)
    assert response.version_number == 1
    assert response.data["vocabulary"]["complexity"] == "moderate"


# --- DNAVersionResponse ---


def test_dna_version_response() -> None:
    """DNAVersionResponse should be structured like DNAResponse."""
    data = {
        "id": "dna-1",
        "clone_id": "clone-1",
        "version_number": 1,
        "data": {},
        "prominence_scores": None,
        "trigger": "analysis",
        "model_used": "gpt-4o",
        "created_at": "2026-01-01T00:00:00",
    }
    response = DNAVersionResponse.model_validate(data)
    assert response.trigger == "analysis"


# --- DNAVersionListResponse ---


def test_dna_version_list_response() -> None:
    """DNAVersionListResponse should have items."""
    response = DNAVersionListResponse(items=[])
    assert response.items == []


# --- MethodologyUpdate ---


def test_methodology_update_rejects_empty_content() -> None:
    """MethodologyUpdate should reject empty content."""
    with pytest.raises(ValidationError):
        MethodologyUpdate(content="")


def test_methodology_update_accepts_valid_content() -> None:
    """MethodologyUpdate should accept non-empty content."""
    update = MethodologyUpdate(content="New methodology instructions.")
    assert update.content == "New methodology instructions."


# --- MethodologyResponse ---


def test_methodology_response_structure() -> None:
    """MethodologyResponse should map settings fields."""
    data = {
        "id": "method-1",
        "section_key": "voice_cloning",
        "current_content": "Instructions here.",
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    response = MethodologyResponse.model_validate(data)
    assert response.section_key == "voice_cloning"


# --- MethodologyVersionResponse ---


def test_methodology_version_response() -> None:
    """MethodologyVersionResponse should have version fields."""
    data = {
        "id": "ver-1",
        "settings_id": "method-1",
        "version_number": 1,
        "content": "First version",
        "trigger": "manual",
        "created_at": "2026-01-01T00:00:00",
    }
    response = MethodologyVersionResponse.model_validate(data)
    assert response.version_number == 1


# --- ProviderUpdate ---


def test_provider_update_with_api_key() -> None:
    """ProviderUpdate should accept api_key and model."""
    update = ProviderUpdate(api_key="sk-test-key", default_model="gpt-4o")
    assert update.api_key == "sk-test-key"
    assert update.default_model == "gpt-4o"


# --- ProviderResponse ---


def test_provider_response_masks_key() -> None:
    """ProviderResponse should have a masked key field."""
    data = {
        "name": "openai",
        "is_configured": True,
        "masked_key": "****-key",
        "default_model": "gpt-4o",
        "available_models": ["gpt-4o", "gpt-4o-mini"],
    }
    response = ProviderResponse.model_validate(data)
    assert response.masked_key == "****-key"
    assert response.is_configured is True


# --- ProviderTestResponse ---


def test_provider_test_response() -> None:
    """ProviderTestResponse should indicate success/failure."""
    response = ProviderTestResponse(success=True, message="Connection successful")
    assert response.success is True


# --- PresetCreate ---


def test_preset_create() -> None:
    """PresetCreate should require name and properties."""
    preset = PresetCreate(name="Casual", properties={"tone": "casual"})
    assert preset.name == "Casual"
    assert preset.properties == {"tone": "casual"}


# --- PresetUpdate ---


def test_preset_update_all_optional() -> None:
    """PresetUpdate should allow all fields optional."""
    update = PresetUpdate()
    assert update.name is None


# --- PresetResponse ---


def test_preset_response() -> None:
    """PresetResponse should map preset fields."""
    data = {
        "id": "preset-1",
        "name": "Formal",
        "properties": {"tone": "formal"},
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    response = PresetResponse.model_validate(data)
    assert response.name == "Formal"


# --- AuthenticityScoreResponse ---


def test_authenticity_score_response() -> None:
    """AuthenticityScoreResponse should have overall score and dimensions."""
    response = AuthenticityScoreResponse(
        overall_score=85,
        dimensions=[
            DimensionScore(name="vocabulary", score=90, feedback="Good vocabulary match"),
            DimensionScore(name="tone", score=80, feedback="Tone is close"),
        ],
    )
    assert response.overall_score == 85
    assert len(response.dimensions) == 2
    assert response.dimensions[0].name == "vocabulary"


# --- DimensionScore ---


def test_dimension_score() -> None:
    """DimensionScore should have name, score, and feedback."""
    dim = DimensionScore(name="syntax", score=75, feedback="Sentence structure varies")
    assert dim.name == "syntax"
    assert dim.score == 75
