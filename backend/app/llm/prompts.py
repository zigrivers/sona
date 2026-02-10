"""Prompt template functions for LLM interactions."""


def build_dna_analysis_prompt(
    samples: list[str],
    methodology: str | None = None,
) -> list[dict[str, str]]:
    """Build a message list for Voice DNA analysis.

    Args:
        samples: Writing sample texts to analyze.
        methodology: Optional methodology hint (e.g. "detailed", "quick").

    Returns:
        A list of message dicts with role/content keys.
    """
    system_parts = [
        "You are an expert linguist analyzing writing samples to extract a Voice DNA profile.",
        "Identify patterns in tone, vocabulary, sentence structure, rhythm, and stylistic quirks.",
        "Return a structured JSON object with the voice dimensions.",
        (
            "Also rate the overall voice consistency across all samples as a"
            " consistency_score (0-100), where 100 means the writing voice is"
            " perfectly consistent across all samples."
        ),
    ]
    if methodology:
        system_parts.append(f"Use the '{methodology}' analysis methodology.")

    numbered_samples = "\n\n".join(
        f"--- Sample {i + 1} ---\n{text}" for i, text in enumerate(samples)
    )

    return [
        {"role": "system", "content": " ".join(system_parts)},
        {"role": "user", "content": f"Analyze these writing samples:\n\n{numbered_samples}"},
    ]


def build_generation_prompt(
    dna: dict[str, str],
    platform: str,
    input_text: str,
    properties: dict[str, str] | None = None,
) -> list[dict[str, str]]:
    """Build a message list for content generation using Voice DNA.

    Args:
        dna: Voice DNA profile dict with trait dimensions.
        platform: Target platform (e.g. "twitter", "linkedin", "email").
        input_text: The user's input/instructions for generation.
        properties: Optional extra generation properties.

    Returns:
        A list of message dicts with role/content keys.
    """
    dna_summary = "\n".join(f"- {key}: {value}" for key, value in dna.items())

    system_parts = [
        "You are a ghostwriter that matches the user's unique voice.",
        f"Voice DNA profile:\n{dna_summary}",
        f"Target platform: {platform}.",
        "Write content that authentically matches this voice for the given platform.",
    ]
    if properties:
        props_text = ", ".join(f"{k}={v}" for k, v in properties.items())
        system_parts.append(f"Additional properties: {props_text}.")

    return [
        {"role": "system", "content": "\n\n".join(system_parts)},
        {"role": "user", "content": input_text},
    ]


_SCORING_DIMENSIONS = [
    "vocabulary_match",
    "sentence_flow",
    "structural_rhythm",
    "tone_fidelity",
    "rhetorical_fingerprint",
    "punctuation_signature",
    "hook_and_close",
    "voice_personality",
]


def build_scoring_prompt(
    dna_json: str,
    content_text: str,
) -> list[dict[str, str]]:
    """Build a message list for authenticity scoring of generated content.

    Args:
        dna_json: JSON string of the Voice DNA profile.
        content_text: The generated content text to score.

    Returns:
        A list of message dicts with role/content keys.
    """
    dim_list = ", ".join(_SCORING_DIMENSIONS)

    system_content = "\n\n".join(
        [
            "You are an expert voice analyst evaluating how authentically"
            " a piece of content matches an author's Voice DNA.",
            f"Score the content on these 8 dimensions (0-100 each): {dim_list}.",
            "Return ONLY a JSON object in this exact format:\n"
            '{"dimensions": [{"name": "<dimension>", "score": <0-100>,'
            ' "feedback": "<actionable feedback>"}]}',
            "For any dimension scoring below 70, provide specific,"
            " actionable feedback with examples of how to improve.",
            "For dimensions scoring 70 or above, a brief positive note is sufficient.",
            f"Voice DNA profile:\n{dna_json}",
        ]
    )

    user_content = f"Score the following content for voice authenticity:\n\n{content_text}"

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]
