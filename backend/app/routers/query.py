from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime

from ..models.user import UserInDB
from ..routers.auth import get_current_user
from ..services.rag_service import RAGService
from ..utils.database import get_database
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/query", tags=["Query"])

class QueryRequest(BaseModel):
    question: str
    conversation_history: Optional[List[Dict]] = []

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict] = []
    confidence: float = 0.0

# Initialize RAG service
rag_service = RAGService()

@router.post("/{document_id}/ask", response_model=QueryResponse)
async def ask_question(
    document_id: str,
    query: QueryRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Ask a question about the document using RAG"""
    db = get_database()
    
    # Verify document access
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if document["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document processing not completed"
        )
    
    try:
        # Get answer using RAG
        result = await rag_service.answer_question(
            document_id=document_id,
            question=query.question,
            conversation_history=query.conversation_history
        )
        
        # Log query
        await db.queries.insert_one({
            "user_id": current_user.id,
            "document_id": document_id,
            "question": query.question,
            "answer": result["answer"],
            "sources_count": len(result.get("sources", [])),
            "timestamp": datetime.utcnow()
        })
        
        # Update user query count
        from ..services.auth_service import AuthService
        auth_service = AuthService(db)
        await auth_service.increment_query_count(current_user.id)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            confidence=result.get("confidence", 0.0)
        )
        
    except Exception as e:
        logger.error(f"Query error for document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process question: {str(e)}"
        )

@router.get("/{document_id}/history")
async def get_query_history(
    document_id: str,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get query history for a document"""
    db = get_database()
    
    # Verify document access
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get queries
    cursor = db.queries.find({
        "document_id": document_id,
        "user_id": current_user.id
    }).sort("timestamp", -1).limit(limit)
    
    queries = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for query in queries:
        query["_id"] = str(query["_id"])
    
    return {"queries": queries}