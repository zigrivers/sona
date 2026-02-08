from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite+aiosqlite:///{PROJECT_ROOT / 'data' / 'sona.db'}"

    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""


settings = Settings()
