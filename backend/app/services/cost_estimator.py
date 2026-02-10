"""Token cost estimator for LLM operations.

Provides approximate cost estimates for DNA analysis and content generation.
Uses chars/4 approximation for token counting (same as provider implementations).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.constants import MODEL_PRICING

# Approximate overhead for system prompts (in characters).
_DNA_SYSTEM_PROMPT_CHARS = 800
_GENERATION_SYSTEM_PROMPT_CHARS = 600

# Default output token estimate per operation.
_DNA_OUTPUT_TOKENS = 2000
_GENERATION_OUTPUT_TOKENS_PER_PLATFORM = 1000


def _chars_to_tokens(chars: int) -> int:
    """Approximate token count from character count (1 token ≈ 4 chars)."""
    return max(chars // 4, 1)


def _calculate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    """Calculate USD cost from token counts and model pricing."""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return 0.0
    input_price = float(pricing["input"])
    output_price = float(pricing["output"])
    return (input_tokens / 1_000_000) * input_price + (output_tokens / 1_000_000) * output_price


@dataclass(frozen=True)
class CostEstimate:
    """Token and cost estimate for an LLM operation."""

    input_tokens: int
    output_tokens: int
    cost_usd: float
    model: str

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    @property
    def formatted(self) -> str:
        return format_cost(self.cost_usd)


def format_cost(cost_usd: float) -> str:
    """Format a cost in USD for display."""
    if cost_usd < 0.01:
        return "<$0.01 estimated"
    return f"${cost_usd:.2f} estimated"


def estimate_dna_analysis(
    sample_texts: list[str],
    *,
    model: str,
    methodology: str | None = None,
) -> CostEstimate:
    """Estimate tokens and cost for a DNA analysis operation."""
    sample_chars = sum(len(t) for t in sample_texts)
    methodology_chars = len(methodology) if methodology else 0
    total_input_chars = _DNA_SYSTEM_PROMPT_CHARS + sample_chars + methodology_chars

    input_tokens = _chars_to_tokens(total_input_chars)
    output_tokens = _DNA_OUTPUT_TOKENS
    cost = _calculate_cost(input_tokens, output_tokens, model)

    return CostEstimate(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
        model=model,
    )


def estimate_generation(
    *,
    input_text: str,
    dna_summary: str,
    platforms: list[str],
    model: str,
) -> CostEstimate:
    """Estimate tokens and cost for content generation across platforms."""
    platform_count = max(len(platforms), 1)
    base_input_chars = _GENERATION_SYSTEM_PROMPT_CHARS + len(input_text) + len(dna_summary)
    input_tokens = _chars_to_tokens(base_input_chars) * platform_count
    output_tokens = _GENERATION_OUTPUT_TOKENS_PER_PLATFORM * platform_count
    cost = _calculate_cost(input_tokens, output_tokens, model)

    return CostEstimate(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
        model=model,
    )
