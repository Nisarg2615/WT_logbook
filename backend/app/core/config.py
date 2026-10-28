import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "eLogBook Phase 1"
    # Fallback to sqlite if MySQL connection fails or is not setup to ensure demo works
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./elogbook.db")

settings = Settings()
