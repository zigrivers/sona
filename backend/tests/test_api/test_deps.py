import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_llm_provider, get_session
from app.database import get_session as db_get_session
from app.exceptions import ProviderNotConfiguredError


def test_get_session_is_database_get_session() -> None:
    """deps.get_session should be the database get_session function."""
    assert get_session is db_get_session


async def test_get_session_yields_async_session(session: AsyncSession) -> None:
    """get_session dependency should yield an AsyncSession."""
    assert isinstance(session, AsyncSession)


async def test_get_llm_provider_raises_when_no_provider() -> None:
    """get_llm_provider should raise ProviderNotConfiguredError when no provider is set."""
    with pytest.raises(ProviderNotConfiguredError):
        await get_llm_provider()
