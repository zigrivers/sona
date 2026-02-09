"""Tests for OpenAI LLM provider."""

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.exceptions import LLMAuthError, LLMNetworkError, LLMRateLimitError
from app.llm.openai import OpenAIProvider


@pytest.fixture
def provider() -> OpenAIProvider:
    return OpenAIProvider(api_key="sk-test-key", default_model="gpt-4o")


def _make_choice(content: str) -> MagicMock:
    """Build a mock Choice with message.content."""
    choice = MagicMock()
    choice.message.content = content
    return choice


def _make_completion(content: str) -> MagicMock:
    """Build a mock ChatCompletion response."""
    completion = MagicMock()
    completion.choices = [_make_choice(content)]
    return completion


def _make_stream_chunk(content: str | None, finish_reason: str | None = None) -> MagicMock:
    """Build a mock streaming chunk."""
    chunk = MagicMock()
    delta = MagicMock()
    delta.content = content
    choice = MagicMock()
    choice.delta = delta
    choice.finish_reason = finish_reason
    chunk.choices = [choice]
    return chunk


@pytest.mark.asyncio
async def test_complete_returns_response_text(provider: OpenAIProvider) -> None:
    """complete() should return the message content from the API response."""
    mock_response = _make_completion("Hello, world!")

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        result = await provider.complete([{"role": "user", "content": "Hi"}])

    assert result == "Hello, world!"


@pytest.mark.asyncio
async def test_complete_passes_model_and_temperature(provider: OpenAIProvider) -> None:
    """complete() should forward model, temperature, and max_tokens to the API."""
    mock_response = _make_completion("response")

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        await provider.complete(
            [{"role": "user", "content": "Hi"}],
            model="gpt-4o-mini",
            temperature=0.5,
            max_tokens=2000,
        )

    mock_create.assert_called_once_with(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hi"}],
        temperature=0.5,
        max_tokens=2000,
    )


@pytest.mark.asyncio
async def test_complete_uses_default_model(provider: OpenAIProvider) -> None:
    """complete() should use the default model when none is specified."""
    mock_response = _make_completion("response")

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        await provider.complete([{"role": "user", "content": "Hi"}])

    call_kwargs = mock_create.call_args[1]
    assert call_kwargs["model"] == "gpt-4o"


@pytest.mark.asyncio
async def test_stream_yields_chunks(provider: OpenAIProvider) -> None:
    """stream() should yield content strings from the streaming response."""
    chunks = [
        _make_stream_chunk("Hello"),
        _make_stream_chunk(", "),
        _make_stream_chunk("world!"),
        _make_stream_chunk(None, finish_reason="stop"),
    ]

    async def mock_stream() -> None:
        """Async generator for mock stream."""

    mock_async_iter = AsyncMock()
    mock_async_iter.__aiter__ = MagicMock(return_value=iter(chunks))

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        # Create a proper async iterable
        async def fake_stream() -> AsyncIterator[MagicMock]:
            for chunk in chunks:
                yield chunk

        mock_create.return_value = fake_stream()

        collected: list[str] = []
        async for text in provider.stream([{"role": "user", "content": "Hi"}]):
            collected.append(text)

    assert collected == ["Hello", ", ", "world!"]


@pytest.mark.asyncio
async def test_test_connection_returns_true_on_success(provider: OpenAIProvider) -> None:
    """test_connection() should return True when the API responds."""
    mock_response = _make_completion("ok")

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.return_value = mock_response
        result = await provider.test_connection()

    assert result is True


@pytest.mark.asyncio
async def test_test_connection_returns_false_on_failure(provider: OpenAIProvider) -> None:
    """test_connection() should return False when the API call fails."""
    import openai

    with patch.object(
        provider._client.chat.completions, "create", new_callable=AsyncMock
    ) as mock_create:
        mock_create.side_effect = openai.APIConnectionError(request=MagicMock())
        result = await provider.test_connection()

    assert result is False


@pytest.mark.asyncio
async def test_auth_error_maps_to_llm_auth_error(provider: OpenAIProvider) -> None:
    """OpenAI AuthenticationError should map to LLMAuthError."""
    import openai

    with (
        patch.object(
            provider._client.chat.completions, "create", new_callable=AsyncMock
        ) as mock_create,
        pytest.raises(LLMAuthError),
    ):
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_create.side_effect = openai.AuthenticationError(
            message="Invalid API key",
            response=mock_response,
            body=None,
        )
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_rate_limit_maps_to_llm_rate_limit_error(provider: OpenAIProvider) -> None:
    """OpenAI RateLimitError should map to LLMRateLimitError."""
    import openai

    with (
        patch.object(
            provider._client.chat.completions, "create", new_callable=AsyncMock
        ) as mock_create,
        pytest.raises(LLMRateLimitError),
    ):
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_create.side_effect = openai.RateLimitError(
            message="Rate limit exceeded",
            response=mock_response,
            body=None,
        )
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_network_error_maps_to_llm_network_error(provider: OpenAIProvider) -> None:
    """OpenAI APIConnectionError should map to LLMNetworkError."""
    import openai

    with (
        patch.object(
            provider._client.chat.completions, "create", new_callable=AsyncMock
        ) as mock_create,
        pytest.raises(LLMNetworkError),
    ):
        mock_create.side_effect = openai.APIConnectionError(request=MagicMock())
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_count_tokens_returns_estimate(provider: OpenAIProvider) -> None:
    """count_tokens() should return a reasonable token estimate."""
    result = await provider.count_tokens("Hello world, this is a test sentence.")

    # Approximate: 1 token ≈ 4 chars, so ~9 tokens for a 37-char string
    assert isinstance(result, int)
    assert result > 0
