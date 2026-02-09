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
    def __init__(self) -> None:
        super().__init__(
            detail="No AI provider configured. Add an API key in Settings > Providers.",
            code="PROVIDER_NOT_CONFIGURED",
        )


class AnalysisFailedError(SonaError):
    def __init__(self, provider: str, reason: str) -> None:
        super().__init__(
            detail=f"Voice analysis failed via {provider}: {reason}",
            code="ANALYSIS_FAILED",
        )


class LLMAuthError(SonaError):
    pass


class LLMRateLimitError(SonaError):
    pass


class LLMNetworkError(SonaError):
    pass


class LLMQuotaError(SonaError):
    pass
