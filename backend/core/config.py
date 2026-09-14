from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MarketLens API"
    VERSION: str = "1.0.0"
    
    # Read ALLOWED_ORIGINS as a string, we will split it in main.py
    ALLOWED_ORIGINS: str = "*"
    
    # AI Keys and Model
    GEMINI_API_KEY: str | None = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")

    class Config:
        case_sensitive = True

settings = Settings()
