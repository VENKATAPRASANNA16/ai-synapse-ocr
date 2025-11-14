from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Synapse OCR"
    APP_VERSION: str = "1.2.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "ai_synapse_ocr"
    MONGODB_MAX_POOL_SIZE: int = 10
    MONGODB_MIN_POOL_SIZE: int = 1
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # OpenAI
    OPENAI_API_KEY: str = ""  # Make it optional with default empty string
    OPENAI_MODEL: str = "gpt-4"
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png,tiff"
    UPLOAD_FOLDER: str = "./uploads"
    
    # OCR
    OCR_CONFIDENCE_THRESHOLD: float = 0.6
    GPU_ENABLED: bool = False
    DEFAULT_OCR_ENGINE: str = "tesseract"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Rate Limiting
    GUEST_UPLOAD_LIMIT: int = 1
    GUEST_QUERY_LIMIT: int = 3
    AUTHENTICATED_UPLOAD_LIMIT: int = 100
    AUTHENTICATED_QUERY_LIMIT: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Changed from default to ignore extra fields
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return self.ALLOWED_EXTENSIONS.split(',')
    
    @property
    def cors_origins_list(self) -> List[str]:
        return self.CORS_ORIGINS.split(',')

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()