from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Synapse OCR"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # MongoDB
    MONGODB_USERNAME: str = ""
    MONGODB_PASSWORD: str = ""
    MONGODB_HOST: str = "localhost"
    MONGODB_PORT: int = 27017
    MONGODB_DB_NAME: str = "ai_synapse"
    MONGODB_MAX_POOL_SIZE: int = 10
    MONGODB_MIN_POOL_SIZE: int = 1

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""  # Set your DeepSeek API key here
    OPENAI_MODEL: str = "deepseek-chat"  # DeepSeek model name

    # File upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,tiff,bmp"
    UPLOAD_FOLDER: str = "./uploads"

    # OCR
    OCR_CONFIDENCE_THRESHOLD: float = 0.8
    GPU_ENABLED: bool = False
    DEFAULT_OCR_ENGINE: str = "tesseract"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Rate limiting
    GUEST_UPLOAD_LIMIT: int = 3
    GUEST_QUERY_LIMIT: int = 10
    AUTHENTICATED_UPLOAD_LIMIT: int = 100
    AUTHENTICATED_QUERY_LIMIT: int = 100

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8"
    )

    # Dynamically build MongoDB URL
    def get_mongodb_url(self) -> str:
        """Build MongoDB URL based on whether auth is needed"""
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            return (
                f"mongodb://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}"
                f"@{self.MONGODB_HOST}:{self.MONGODB_PORT}/"
                f"{self.MONGODB_DB_NAME}?authSource=admin"
            )
        else:
            # No authentication
            return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}"
    
    @property
    def MONGODB_URL(self) -> str:
        """Property for backward compatibility"""
        return self.get_mongodb_url()
    
    @property
    def DATABASE_NAME(self) -> str:
        """Alias for MONGODB_DB_NAME"""
        return self.MONGODB_DB_NAME
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Get list of allowed extensions"""
        return self.ALLOWED_EXTENSIONS.split(',')
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get list of CORS origins"""
        return self.CORS_ORIGINS.split(',')

settings = Settings()