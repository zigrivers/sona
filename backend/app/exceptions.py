"""Domain exception classes for Sona. Append-only file."""


class SonaError(Exception):
    """Base exception for all Sona domain errors."""

    def __init__(self, detail: str, code: str) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)


class CloneNotFoundError(SonaError):
    def __init__(self, clone_id: str) -> None:
        super().__init__(
            detail=f"Voice clone '{clone_id}' not found",
            code="CLONE_NOT_FOUND",
        )


class SampleNotFoundError(SonaError):
    def __init__(self, sample_id: str) -> None:
        super().__init__(
            detail=f"Writing sample '{sample_id}' not found",
            code="SAMPLE_NOT_FOUND",
        )


class ProviderNotConfiguredError(SonaError):
    def __init__(self, provider_name: str = "") -> None:
        if provider_name:
            detail = (
                f"Provider '{provider_name}' is not configured."
                " Add an API key in Settings > Providers."
            )
        else:
            detail = "No AI provider configured. Add an API key in Settings > Providers."
        super().__init__(detail=detail, code="PROVIDER_NOT_CONFIGURED")


class AnalysisFailedError(SonaError):
    def __init__(self, provider: str, reason: str) -> None:
        super().__init__(
            detail=f"Voice analysis failed via {provider}: {reason}",
            code="ANALYSIS_FAILED",
        )


class LLMAuthError(SonaError):
    def __init__(
        self, *, provider: str = "", detail: str = "", code: str = "LLM_AUTH_ERROR"
    ) -> None:
        msg = detail or f"Authentication failed for provider '{provider}'"
        super().__init__(detail=msg, code=code)


class LLMRateLimitError(SonaError):
    def __init__(
        self, *, provider: str = "", detail: str = "", code: str = "LLM_RATE_LIMIT"
    ) -> None:
        msg = detail or f"Rate limit exceeded for provider '{provider}'"
        super().__init__(detail=msg, code=code)


class LLMNetworkError(SonaError):
    def __init__(
        self, *, provider: str = "", detail: str = "", code: str = "LLM_NETWORK_ERROR"
    ) -> None:
        msg = detail or f"Network error for provider '{provider}'"
        super().__init__(detail=msg, code=code)


class LLMQuotaError(SonaError):
    def __init__(
        self, *, provider: str = "", detail: str = "", code: str = "LLM_QUOTA_EXCEEDED"
    ) -> None:
        msg = detail or f"Quota exceeded for provider '{provider}'"
        super().__init__(detail=msg, code=code)


class ContentNotFoundError(SonaError):
    def __init__(self, content_id: str) -> None:
        super().__init__(
            detail=f"Content '{content_id}' not found",
            code="CONTENT_NOT_FOUND",
        )


class DemoCloneReadonlyError(SonaError):
    def __init__(self, clone_id: str) -> None:
        super().__init__(
            detail=f"Demo clone '{clone_id}' cannot be modified or deleted",
            code="DEMO_CLONE_READONLY",
        )
