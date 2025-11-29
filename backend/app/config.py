from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool
    HOST: str
    PORT: int

    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int

    # MongoDB
    MONGODB_USERNAME: str
    MONGODB_PASSWORD: str
    MONGODB_HOST: str
    MONGODB_PORT: int
    MONGODB_DB_NAME: str
    MONGODB_MAX_POOL_SIZE: int
    MONGODB_MIN_POOL_SIZE: int
    MONGODB_URL: str = "mongodb://localhost:27017"

    # Redis
    REDIS_URL: str

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str

    # File upload
    MAX_FILE_SIZE_MB: int
    ALLOWED_EXTENSIONS: str
    UPLOAD_FOLDER: str

    # OCR
    OCR_CONFIDENCE_THRESHOLD: float
    GPU_ENABLED: bool
    DEFAULT_OCR_ENGINE: str

    # CORS
    CORS_ORIGINS: str

    # Rate limiting
    GUEST_UPLOAD_LIMIT: int
    GUEST_QUERY_LIMIT: int
    AUTHENTICATED_UPLOAD_LIMIT: int
    AUTHENTICATED_QUERY_LIMIT: int

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8"
    )


    # Dynamically build MongoDB URL
    @property
    def MONGODB_URL(self) -> str:
        return (
            f"mongodb://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}"
            f"@{self.MONGODB_HOST}:{self.MONGODB_PORT}/"
            f"{self.MONGODB_DB_NAME}?authSource=admin"
        )

    # Pydantic settings config
    
settings = Settings()
