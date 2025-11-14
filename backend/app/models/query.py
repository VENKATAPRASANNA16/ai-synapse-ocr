from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Citation(BaseModel):
    document_id: str
    page_number: int
    table_id: Optional[str] = None
    text_snippet: str
    confidence: float

class QueryRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None  # Filter by specific documents
    top_k: int = 5  # Number of results to return

class QueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[Citation]
    confidence: float
    processing_time: float

class QueryHistory(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    query: str
    answer: str
    citations: List[Citation]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True