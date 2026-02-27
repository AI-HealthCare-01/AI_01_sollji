from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str = "change-me"
    debug: bool = True

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
    use_mock_analysis: bool = True
    use_mock_chat: bool = True  # ← 추가

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
