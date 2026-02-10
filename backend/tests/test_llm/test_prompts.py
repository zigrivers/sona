"""Tests for LLM prompt template functions."""

from app.llm.prompts import (
    build_dna_analysis_prompt,
    build_feedback_regen_prompt,
    build_generation_prompt,
    build_partial_regen_prompt,
)


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


class TestBuildFeedbackRegenPrompt:
    def test_includes_dna_current_text_and_feedback(self) -> None:
        """Feedback regen prompt should include DNA traits, current text, and feedback."""
        dna = {"tone": "casual", "humor": "dry"}
        result = build_feedback_regen_prompt(
            dna=dna,
            platform="linkedin",
            current_text="Original blog post content here.",
            feedback="Make it shorter and punchier.",
        )

        assert isinstance(result, list)
        assert len(result) >= 2
        full_text = " ".join(msg["content"] for msg in result)
        assert "casual" in full_text
        assert "Original blog post content here." in full_text
        assert "Make it shorter and punchier." in full_text

    def test_includes_platform(self) -> None:
        """Feedback regen prompt should include the target platform."""
        dna = {"tone": "formal"}
        result = build_feedback_regen_prompt(
            dna=dna,
            platform="twitter",
            current_text="Some content.",
            feedback="Add emojis.",
        )

        full_text = " ".join(msg["content"] for msg in result)
        assert "twitter" in full_text.lower()

    def test_includes_properties(self) -> None:
        """Feedback regen prompt should include optional properties."""
        dna = {"tone": "casual"}
        result = build_feedback_regen_prompt(
            dna=dna,
            platform="blog",
            current_text="Content.",
            feedback="Improve.",
            properties={"length": "short"},
        )

        full_text = " ".join(msg["content"] for msg in result)
        assert "short" in full_text.lower()


class TestBuildPartialRegenPrompt:
    def test_includes_before_selected_after_context(self) -> None:
        """Partial regen prompt should include before, selected, and after text."""
        dna = {"tone": "casual", "humor": "dry"}
        result = build_partial_regen_prompt(
            dna=dna,
            platform="linkedin",
            text_before="This is the beginning. ",
            selected_text="Replace this part.",
            text_after=" This is the ending.",
        )

        assert isinstance(result, list)
        assert len(result) >= 2
        full_text = " ".join(msg["content"] for msg in result)
        assert "This is the beginning." in full_text
        assert "Replace this part." in full_text
        assert "This is the ending." in full_text

    def test_includes_optional_feedback(self) -> None:
        """Partial regen prompt should include optional feedback guidance."""
        dna = {"tone": "formal"}
        result = build_partial_regen_prompt(
            dna=dna,
            platform="email",
            text_before="Before. ",
            selected_text="Selected.",
            text_after=" After.",
            feedback="Make it more formal.",
        )

        full_text = " ".join(msg["content"] for msg in result)
        assert "Make it more formal." in full_text

    def test_without_feedback_still_works(self) -> None:
        """Partial regen prompt should work without feedback."""
        dna = {"tone": "casual"}
        result = build_partial_regen_prompt(
            dna=dna,
            platform="blog",
            text_before="Start. ",
            selected_text="Middle.",
            text_after=" End.",
        )

        assert isinstance(result, list)
        assert len(result) >= 2
        full_text = " ".join(msg["content"] for msg in result)
        assert "Middle." in full_text
