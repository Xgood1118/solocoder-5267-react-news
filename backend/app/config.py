from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./news_aggregator.db"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    CRAWLER_INTERVAL_MINUTES: int = 30
    CRAWLER_TIMEOUT: int = 10
    CRAWLER_MAX_RETRIES: int = 3
    CRAWLER_DELAY_MIN: float = 1.0
    CRAWLER_DELAY_MAX: float = 3.0
    CRAWLER_COOLDOWN_HOURS: int = 1

    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    NOTIFICATION_BATCH_SIZE: int = 10

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
