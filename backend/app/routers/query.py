from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from ..models.query import QueryRequest, QueryResponse, QueryHistory
from ..models.user import UserInDB
from ..routers.auth import get_current_user
from ..services.rag_service import RAGService
from ..services.embedding_service import EmbeddingService
from ..services.auth_service import AuthService
from ..utils.database import get_database
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/query", tags=["Query & RAG"])

@router.post("/", response_model=QueryResponse)
async def query_documents(
    query_request: QueryRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Query documents using natural language"""
    db = get_database()
    
    # Check query limit
    if current_user.query_count >= settings.AUTHENTICATED_QUERY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Query limit reached"
        )
    
    try:
        # Initialize services
        embedding_service = EmbeddingService()
        rag_service = RAGService(db, embedding_service)
        
        # Process query
        response = await rag_service.process_query(query_request, current_user.id)
        
        # Increment query count
        auth_service = AuthService(db)
        await auth_service.increment_query_count(current_user.id)
        
        # Log to audit
        await db.audit_logs.insert_one({
            "user_id": current_user.id,
            "action": "query",
            "query": query_request.query,
            "timestamp": datetime.utcnow()
        })
        
        return response
    
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query processing failed: {str(e)}"
        )

@router.get("/history", response_model=List[QueryHistory])
async def get_query_history(
    skip: int = 0,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's query history"""
    db = get_database()
    
    cursor = db.query_history.find(
        {"user_id": current_user.id}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    queries = await cursor.to_list(length=limit)
    
    result = []
    for query in queries:
        query["_id"] = str(query["_id"])
        result.append(QueryHistory(**query))
    
    return result

@router.delete("/history/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_query_from_history(
    query_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a query from history"""
    db = get_database()
    
    query = await db.query_history.find_one({"_id": query_id})
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found"
        )
    
    if query["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await db.query_history.delete_one({"_id": query_id})
    
    return None