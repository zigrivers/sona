import pytest

from app.exceptions import (
    AnalysisFailedError,
    CloneNotFoundError,
    LLMAuthError,
    LLMNetworkError,
    LLMQuotaError,
    LLMRateLimitError,
    ProviderNotConfiguredError,
    SampleNotFoundError,
    SonaError,
)


def test_sona_error_has_detail_and_code() -> None:
    """SonaError should store detail and code attributes."""
    error = SonaError(detail="something broke", code="TEST_ERROR")
    assert error.detail == "something broke"
    assert error.code == "TEST_ERROR"
    assert str(error) == "something broke"


def test_clone_not_found_error_formats_message() -> None:
    """CloneNotFoundError should include the clone_id in its message."""
    error = CloneNotFoundError("abc123")
    assert "abc123" in error.detail
    assert error.code == "CLONE_NOT_FOUND"


def test_sample_not_found_error_formats_message() -> None:
    """SampleNotFoundError should include the sample_id in its message."""
    error = SampleNotFoundError("sample-xyz")
    assert "sample-xyz" in error.detail
    assert error.code == "SAMPLE_NOT_FOUND"


def test_provider_not_configured_error_code() -> None:
    """ProviderNotConfiguredError should have a fixed code."""
    error = ProviderNotConfiguredError()
    assert error.code == "PROVIDER_NOT_CONFIGURED"
    assert "provider" in error.detail.lower() or "configured" in error.detail.lower()


def test_analysis_failed_error_includes_provider_and_reason() -> None:
    """AnalysisFailedError should mention the provider and reason."""
    error = AnalysisFailedError(provider="openai", reason="timeout")
    assert "openai" in error.detail
    assert "timeout" in error.detail
    assert error.code == "ANALYSIS_FAILED"


def test_llm_auth_error() -> None:
    """LLMAuthError should have the correct code."""
    error = LLMAuthError(detail="Invalid API key", code="LLM_AUTH_ERROR")
    assert error.code == "LLM_AUTH_ERROR"


def test_llm_rate_limit_error() -> None:
    """LLMRateLimitError should have the correct code."""
    error = LLMRateLimitError(detail="Rate limited", code="LLM_RATE_LIMIT")
    assert error.code == "LLM_RATE_LIMIT"


def test_llm_network_error() -> None:
    """LLMNetworkError should have the correct code."""
    error = LLMNetworkError(detail="Connection failed", code="LLM_NETWORK_ERROR")
    assert error.code == "LLM_NETWORK_ERROR"


def test_llm_quota_error() -> None:
    """LLMQuotaError should have the correct code."""
    error = LLMQuotaError(detail="Quota exceeded", code="LLM_QUOTA_ERROR")
    assert error.code == "LLM_QUOTA_ERROR"


def test_sona_error_is_base_for_all_domain_errors() -> None:
    """All domain errors should inherit from SonaError."""
    assert issubclass(CloneNotFoundError, SonaError)
    assert issubclass(SampleNotFoundError, SonaError)
    assert issubclass(ProviderNotConfiguredError, SonaError)
    assert issubclass(AnalysisFailedError, SonaError)
    assert issubclass(LLMAuthError, SonaError)
    assert issubclass(LLMRateLimitError, SonaError)
    assert issubclass(LLMNetworkError, SonaError)
    assert issubclass(LLMQuotaError, SonaError)


def test_clone_not_found_can_be_caught_as_sona_error() -> None:
    """Catching SonaError should also catch CloneNotFoundError."""
    with pytest.raises(SonaError):
        raise CloneNotFoundError("test-id")
