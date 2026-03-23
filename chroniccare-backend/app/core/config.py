from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str = ""
    debug: bool = False
    allowed_origins: str = ""
    allowed_hosts: str = ""
    admin_email: str = "sollji97@gmail.com"

    # PostgreSQL
    postgres_user: str = "ai_health_user"
    postgres_password: str = "ai_health_pass"
    postgres_db: str = "ai_health_db"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379

    # OpenAI
    openai_api_key: str = ""

    # Naver Clova OCR
    clova_ocr_secret: str = ""
    clova_ocr_apigw_url: str = ""

    # Mock 설정
    use_mock_ocr: bool = False
    use_mock_analysis: bool = False
    use_mock_chat: bool = False

    # JWT
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # 환경
    environment: str = "production"

    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env", PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins.strip():
            return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

        if self.app_env == "production":
            return [
                "https://chroniccare.site",
                "https://www.chroniccare.site",
                "http://chroniccare.site",
                "http://www.chroniccare.site",
            ]

        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]

    @property
    def trusted_hosts(self) -> list[str]:
        if self.allowed_hosts.strip():
            return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]

        if self.app_env == "production":
            return [
                "chroniccare.site",
                "www.chroniccare.site",
                "54.180.193.218",
                "localhost",
                "127.0.0.1",
            ]

        return ["*"]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
