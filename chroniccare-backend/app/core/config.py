from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str = ""
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
    use_mock_analysis: bool = False
    use_mock_chat: bool = False

    # JWT
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # 환경
    environment: str = "production"

    model_config = {
        "env_file": None,          # .env 파일 안 읽음, OS 환경변수만 사용
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

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
