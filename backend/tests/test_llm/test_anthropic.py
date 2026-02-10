"""Tests for Anthropic LLM provider."""

from unittest.mock import AsyncMock, MagicMock, patch

import anthropic
import pytest

from app.exceptions import LLMAuthError, LLMRateLimitError
from app.llm.anthropic import AnthropicProvider


@pytest.fixture
def provider() -> AnthropicProvider:
    return AnthropicProvider(api_key="sk-ant-test-key", default_model="claude-sonnet-4-5-20250929")


MESSAGES = [{"role": "user", "content": "Hello"}]


class TestComplete:
    async def test_returns_response_text(self, provider: AnthropicProvider) -> None:
        """complete() calls messages.create and returns text content."""
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Hello from Claude")]

        with patch.object(
            provider._client.messages, "create", new_callable=AsyncMock, return_value=mock_response
        ) as mock_create:
            result = await provider.complete(MESSAGES)

        assert result == "Hello from Claude"
        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["model"] == "claude-sonnet-4-5-20250929"
        assert call_kwargs["max_tokens"] == 4096

    async def test_uses_custom_model_and_params(self, provider: AnthropicProvider) -> None:
        """complete() passes through model, temperature, and max_tokens."""
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="response")]

        with patch.object(
            provider._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_create:
            await provider.complete(
                MESSAGES,
                model="claude-haiku-4-5-20251001",
                temperature=0.5,
                max_tokens=1000,
            )

        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["model"] == "claude-haiku-4-5-20251001"
        assert call_kwargs["temperature"] == 0.5
        assert call_kwargs["max_tokens"] == 1000

    async def test_auth_error_maps_to_llm_auth_error(self, provider: AnthropicProvider) -> None:
        """AuthenticationError from Anthropic SDK maps to LLMAuthError."""
        error = anthropic.AuthenticationError(
            message="Invalid API key",
            response=MagicMock(status_code=401),
            body={"error": {"message": "Invalid API key"}},
        )

        with (
            patch.object(
                provider._client.messages,
                "create",
                new_callable=AsyncMock,
                side_effect=error,
            ),
            pytest.raises(LLMAuthError),
        ):
            await provider.complete(MESSAGES)

    async def test_rate_limit_error_maps_to_llm_rate_limit_error(
        self, provider: AnthropicProvider
    ) -> None:
        """RateLimitError from Anthropic SDK maps to LLMRateLimitError."""
        error = anthropic.RateLimitError(
            message="Rate limit exceeded",
            response=MagicMock(status_code=429),
            body={"error": {"message": "Rate limit exceeded"}},
        )

        with (
            patch.object(
                provider._client.messages,
                "create",
                new_callable=AsyncMock,
                side_effect=error,
            ),
            pytest.raises(LLMRateLimitError),
        ):
            await provider.complete(MESSAGES)


class TestStream:
    async def test_yields_chunks(self, provider: AnthropicProvider) -> None:
        """stream() yields text chunks from Anthropic streaming response."""
        # Mock the streaming context manager
        mock_event1 = MagicMock()
        mock_event1.type = "content_block_delta"
        mock_event1.delta = MagicMock(text="Hello ")

        mock_event2 = MagicMock()
        mock_event2.type = "content_block_delta"
        mock_event2.delta = MagicMock(text="world")

        mock_event3 = MagicMock()
        mock_event3.type = "message_stop"

        # Create async iterator for the stream
        async def mock_stream_events():
            for event in [mock_event1, mock_event2, mock_event3]:
                yield event

        mock_stream = MagicMock()
        mock_stream.__aiter__ = lambda self: mock_stream_events()
        mock_stream.__aenter__ = AsyncMock(return_value=mock_stream)
        mock_stream.__aexit__ = AsyncMock(return_value=False)

        with patch.object(provider._client.messages, "stream", return_value=mock_stream):
            chunks = []
            async for chunk in provider.stream(MESSAGES):
                chunks.append(chunk)

        assert chunks == ["Hello ", "world"]


class TestTestConnection:
    async def test_returns_true_on_success(self, provider: AnthropicProvider) -> None:
        """test_connection() returns True when API responds successfully."""
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Hi")]

        with patch.object(
            provider._client.messages, "create", new_callable=AsyncMock, return_value=mock_response
        ):
            result = await provider.test_connection()

        assert result is True

    async def test_returns_false_on_failure(self, provider: AnthropicProvider) -> None:
        """test_connection() returns False when API fails."""
        with patch.object(
            provider._client.messages,
            "create",
            new_callable=AsyncMock,
            side_effect=Exception("connection failed"),
        ):
            result = await provider.test_connection()

        assert result is False


class TestCountTokens:
    async def test_approximate_count(self, provider: AnthropicProvider) -> None:
        """count_tokens() returns approximate count (1 token ≈ 4 chars)."""
        result = await provider.count_tokens("Hello world! This is a test.")
        # 28 chars / 4 = 7
        assert result == 7
