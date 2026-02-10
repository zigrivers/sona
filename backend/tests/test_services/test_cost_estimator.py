"""Tests for token cost estimator service."""

from app.constants import MODEL_PRICING, PROVIDER_MODELS
from app.services.cost_estimator import (
    CostEstimate,
    estimate_dna_analysis,
    estimate_generation,
    format_cost,
)


class TestEstimateDnaAnalysisTokens:
    def test_returns_cost_estimate(self) -> None:
        """DNA analysis estimate should return a CostEstimate with token counts and cost."""
        sample_texts = ["This is sample one.", "This is sample two with more text."]
        result = estimate_dna_analysis(sample_texts, model="gpt-4o")
        assert isinstance(result, CostEstimate)
        assert result.input_tokens > 0
        assert result.output_tokens > 0
        assert result.cost_usd > 0
        assert result.model == "gpt-4o"

    def test_scales_with_sample_length(self) -> None:
        """Longer samples should produce higher token estimates."""
        short = estimate_dna_analysis(["Short."], model="gpt-4o")
        long = estimate_dna_analysis(["A " * 500], model="gpt-4o")
        assert long.input_tokens > short.input_tokens
        assert long.cost_usd > short.cost_usd

    def test_uses_model_pricing(self) -> None:
        """Different models should produce different costs for same input."""
        samples = ["Hello world, this is a writing sample for analysis."]
        cheap = estimate_dna_analysis(samples, model="gemini-2.0-flash")
        expensive = estimate_dna_analysis(samples, model="claude-sonnet-4-5-20250929")
        assert expensive.cost_usd > cheap.cost_usd

    def test_with_methodology(self) -> None:
        """Including methodology should increase input tokens."""
        samples = ["Sample text here."]
        without = estimate_dna_analysis(samples, model="gpt-4o")
        with_meth = estimate_dna_analysis(
            samples, model="gpt-4o", methodology="Analyze voice patterns in detail."
        )
        assert with_meth.input_tokens > without.input_tokens


class TestEstimateGenerationCost:
    def test_returns_cost_estimate(self) -> None:
        """Generation estimate should return a CostEstimate."""
        result = estimate_generation(
            input_text="Write about AI",
            dna_summary="Professional tone, clear language",
            platforms=["linkedin"],
            model="gpt-4o",
        )
        assert isinstance(result, CostEstimate)
        assert result.input_tokens > 0
        assert result.output_tokens > 0
        assert result.cost_usd > 0

    def test_scales_with_platforms(self) -> None:
        """More platforms should cost more (parallel generation)."""
        one = estimate_generation(
            input_text="Write about AI",
            dna_summary="Professional tone",
            platforms=["linkedin"],
            model="gpt-4o",
        )
        three = estimate_generation(
            input_text="Write about AI",
            dna_summary="Professional tone",
            platforms=["linkedin", "twitter", "email"],
            model="gpt-4o",
        )
        assert three.cost_usd > one.cost_usd
        assert three.input_tokens > one.input_tokens

    def test_different_models_different_costs(self) -> None:
        """Same generation with different models should have different costs."""
        cheap = estimate_generation(
            input_text="Write about AI",
            dna_summary="Professional tone",
            platforms=["linkedin"],
            model="gpt-4o-mini",
        )
        expensive = estimate_generation(
            input_text="Write about AI",
            dna_summary="Professional tone",
            platforms=["linkedin"],
            model="gpt-4o",
        )
        assert expensive.cost_usd > cheap.cost_usd


class TestFormatCost:
    def test_format_small_cost(self) -> None:
        """Small costs should show two decimal places."""
        assert format_cost(0.03) == "$0.03 estimated"

    def test_format_sub_cent(self) -> None:
        """Sub-cent costs should show as <$0.01."""
        assert format_cost(0.001) == "<$0.01 estimated"

    def test_format_zero(self) -> None:
        """Zero cost should show as <$0.01."""
        assert format_cost(0.0) == "<$0.01 estimated"

    def test_format_larger_cost(self) -> None:
        """Larger costs should show two decimal places."""
        assert format_cost(1.50) == "$1.50 estimated"


class TestModelPricingCompleteness:
    def test_all_provider_models_have_pricing(self) -> None:
        """Every model in PROVIDER_MODELS should have pricing in MODEL_PRICING."""
        for provider, models in PROVIDER_MODELS.items():
            for model in models:
                assert model in MODEL_PRICING, (
                    f"Model {model} from provider {provider} missing from MODEL_PRICING"
                )

    def test_pricing_has_required_fields(self) -> None:
        """Each model pricing entry should have input, output, and context_window."""
        for model, pricing in MODEL_PRICING.items():
            assert "input" in pricing, f"{model} missing 'input' price"
            assert "output" in pricing, f"{model} missing 'output' price"
            assert "context_window" in pricing, f"{model} missing 'context_window'"


class TestCostEstimateDataclass:
    def test_total_tokens(self) -> None:
        """CostEstimate should compute total tokens."""
        est = CostEstimate(input_tokens=100, output_tokens=50, cost_usd=0.01, model="gpt-4o")
        assert est.total_tokens == 150

    def test_formatted(self) -> None:
        """CostEstimate.formatted should use format_cost."""
        est = CostEstimate(input_tokens=100, output_tokens=50, cost_usd=0.03, model="gpt-4o")
        assert est.formatted == "$0.03 estimated"
