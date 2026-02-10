"""Compile-time constants for Sona. Append-only file."""

# Confidence score thresholds
CONFIDENCE_THRESHOLD_READY = 80
CONFIDENCE_THRESHOLD_USABLE = 60

# Confidence score component weights (must sum to 100)
CONFIDENCE_MAX_WORD_COUNT = 30
CONFIDENCE_MAX_SAMPLE_COUNT = 20
CONFIDENCE_MAX_TYPE_VARIETY = 20
CONFIDENCE_MAX_LENGTH_MIX = 15
CONFIDENCE_MAX_CONSISTENCY = 15

# Platform character limits and labels
PLATFORMS: dict[str, dict[str, int | str]] = {
    "twitter": {"char_limit": 280, "label": "Twitter/X"},
    "linkedin": {"char_limit": 3000, "label": "LinkedIn"},
    "email": {"char_limit": 10000, "label": "Email"},
    "blog": {"char_limit": 50000, "label": "Blog Post"},
    "generic": {"char_limit": 100000, "label": "Generic"},
}

# Model pricing (per 1M tokens)
MODEL_PRICING: dict[str, dict[str, float | int]] = {
    "gpt-4o": {"input": 2.50, "output": 10.00, "context_window": 128_000},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "context_window": 128_000},
    "claude-sonnet-4-5-20250929": {"input": 3.00, "output": 15.00, "context_window": 200_000},
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.00, "context_window": 200_000},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40, "context_window": 1_000_000},
}

# Available models per provider
PROVIDER_MODELS: dict[str, list[str]] = {
    "openai": ["gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
    "google": ["gemini-2.0-flash"],
}

# Version retention limits
MAX_DNA_VERSIONS = 10
MAX_METHODOLOGY_VERSIONS = 10
MAX_SAMPLE_WORDS = 50_000
