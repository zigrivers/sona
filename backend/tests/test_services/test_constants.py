from app.constants import (
    CONFIDENCE_MAX_CONSISTENCY,
    CONFIDENCE_MAX_LENGTH_MIX,
    CONFIDENCE_MAX_SAMPLE_COUNT,
    CONFIDENCE_MAX_TYPE_VARIETY,
    CONFIDENCE_MAX_WORD_COUNT,
    CONFIDENCE_THRESHOLD_READY,
    CONFIDENCE_THRESHOLD_USABLE,
    MAX_DNA_VERSIONS,
    MAX_METHODOLOGY_VERSIONS,
    MAX_SAMPLE_WORDS,
    MODEL_PRICING,
    PLATFORMS,
)


def test_confidence_thresholds_are_correct_values() -> None:
    """Confidence thresholds should be defined with correct values."""
    assert CONFIDENCE_THRESHOLD_READY == 80
    assert CONFIDENCE_THRESHOLD_USABLE == 60


def test_confidence_weights_sum_to_100() -> None:
    """Confidence component weights should add up to 100."""
    total = (
        CONFIDENCE_MAX_WORD_COUNT
        + CONFIDENCE_MAX_SAMPLE_COUNT
        + CONFIDENCE_MAX_TYPE_VARIETY
        + CONFIDENCE_MAX_LENGTH_MIX
        + CONFIDENCE_MAX_CONSISTENCY
    )
    assert total == 100


def test_platform_definitions_include_all_platforms() -> None:
    """Platform definitions should include all expected platforms."""
    expected_platforms = {"twitter", "linkedin", "email", "blog", "generic"}
    assert expected_platforms.issubset(set(PLATFORMS.keys()))


def test_platform_definitions_have_char_limit_and_label() -> None:
    """Each platform should have char_limit and label."""
    for name, config in PLATFORMS.items():
        assert "char_limit" in config, f"Platform '{name}' missing char_limit"
        assert "label" in config, f"Platform '{name}' missing label"
        assert isinstance(config["char_limit"], int)
        assert isinstance(config["label"], str)


def test_model_pricing_has_required_fields() -> None:
    """Each model in MODEL_PRICING should have input, output, context_window."""
    assert len(MODEL_PRICING) > 0
    for model, pricing in MODEL_PRICING.items():
        assert "input" in pricing, f"Model '{model}' missing input price"
        assert "output" in pricing, f"Model '{model}' missing output price"
        assert "context_window" in pricing, f"Model '{model}' missing context_window"


def test_version_retention_limits_are_positive() -> None:
    """Version retention limits should be positive integers."""
    assert MAX_DNA_VERSIONS > 0
    assert MAX_METHODOLOGY_VERSIONS > 0
    assert MAX_SAMPLE_WORDS > 0
