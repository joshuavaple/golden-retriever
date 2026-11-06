from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class NotConfiguredError(RuntimeError):
    """Azure OpenAI settings are missing."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # Optional so the server starts (and /health works) without credentials;
    # they are checked when a suggestion is requested.
    azure_openai_endpoint: str | None = None
    azure_openai_api_key: str | None = None
    azure_openai_deployment: str | None = None
    azure_openai_api_version: str = "2024-10-21"

    question_prompts_path: Path = BACKEND_DIR / "config" / "question_prompts.yaml"
    answer_prompts_path: Path = BACKEND_DIR / "config" / "answer_prompts.yaml"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    def require_azure(self) -> None:
        missing = [
            name.upper()
            for name in ("azure_openai_endpoint", "azure_openai_api_key", "azure_openai_deployment")
            if not getattr(self, name)
        ]
        if missing:
            raise NotConfiguredError(f"Azure OpenAI is not configured; set {', '.join(missing)} in backend/.env")


def get_settings() -> Settings:
    return Settings()
