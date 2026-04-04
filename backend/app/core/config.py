from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://reminders:reminders@db:5432/reminders"
    SECRET_KEY: str = "super-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://frontend:3000"]
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "reminders@app.local"
    REMINDER_CHECK_INTERVAL: int = 60  # seconds

    class Config:
        env_file = ".env"


settings = Settings()
