from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MarketLens API"
    VERSION: str = "1.0.0"
    
    # Read ALLOWED_ORIGINS, default to localhost:3000 if not provided
    ALLOWED_ORIGINS: list[str] = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # AI Keys
    GEMINI_API_KEY: str | None = os.environ.get("GEMINI_API_KEY")

    class Config:
        case_sensitive = True

settings = Settings()
