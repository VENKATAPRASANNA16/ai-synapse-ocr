from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PREPROCESSING = "preprocessing"
    OCR_PROCESSING = "ocr_processing"
    TABLE_EXTRACTION = "table_extraction"
    EMBEDDING_GENERATION = "embedding_generation"
    COMPLETED = "completed"
    FAILED = "failed"

class OCREngine(str, Enum):
    TESSERACT = "tesseract"
    PADDLEOCR = "paddleocr"
    EASYOCR = "easyocr"

class DocumentMetadata(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    page_count: int = 0
    table_count: int = 0
    upload_date: datetime = Field(default_factory=datetime.utcnow)

class OCRResult(BaseModel):
    engine: OCREngine
    text: str
    confidence: float
    processing_time: float
    page_number: int

class TableData(BaseModel):
    table_id: str
    page_number: int
    bounding_box: Dict[str, float]  # x, y, width, height
    rows: int
    columns: int
    data: List[List[str]]
    confidence: float
    extraction_method: str

class DocumentBase(BaseModel):
    user_id: str
    metadata: DocumentMetadata
    status: DocumentStatus = DocumentStatus.UPLOADED
    
class DocumentCreate(DocumentBase):
    gridfs_id: str  # GridFS file ID

class DocumentInDB(DocumentBase):
    id: str = Field(alias="_id")
    gridfs_id: str
    ocr_results: List[OCRResult] = []
    tables: List[TableData] = []
    embeddings_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        populate_by_name = True

class DocumentResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    metadata: DocumentMetadata
    status: DocumentStatus
    table_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class DocumentDetailResponse(DocumentResponse):
    ocr_results: List[OCRResult] = []
    tables: List[TableData] = []
    embeddings_generated: bool
    processing_time: Optional[float] = None