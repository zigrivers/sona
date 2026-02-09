"""Tests for LLM prompt template functions."""

from app.llm.prompts import build_dna_analysis_prompt, build_generation_prompt


def test_build_dna_analysis_prompt_includes_samples() -> None:
    """The DNA analysis prompt should include all sample texts."""
    samples = ["I love writing about tech.", "My casual style is fun and breezy."]
    result = build_dna_analysis_prompt(samples)

    # Should return a list of message dicts
    assert isinstance(result, list)
    assert len(result) >= 2

    # All messages should have role and content
    for msg in result:
        assert "role" in msg
        assert "content" in msg

    # Samples should appear in the user message content
    full_text = " ".join(msg["content"] for msg in result)
    assert "I love writing about tech." in full_text
    assert "My casual style is fun and breezy." in full_text


def test_build_dna_analysis_prompt_includes_methodology() -> None:
    """When methodology is provided, it should appear in the prompt."""
    samples = ["Sample text here."]
    result = build_dna_analysis_prompt(samples, methodology="detailed")

    full_text = " ".join(msg["content"] for msg in result)
    assert "detailed" in full_text


def test_build_generation_prompt_includes_dna_and_platform() -> None:
    """The generation prompt should include DNA traits and platform context."""
    dna = {"tone": "casual", "vocabulary": "simple", "sentence_length": "short"}
    result = build_generation_prompt(
        dna=dna,
        platform="twitter",
        input_text="Write about AI trends",
    )

    assert isinstance(result, list)
    assert len(result) >= 2

    full_text = " ".join(msg["content"] for msg in result)
    assert "casual" in full_text
    assert "twitter" in full_text.lower()
    assert "Write about AI trends" in full_text
