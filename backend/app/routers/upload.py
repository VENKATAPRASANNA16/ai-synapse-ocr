from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List, Optional
import aiofiles
import os
from datetime import datetime
import uuid

from ..models.document import DocumentCreate, DocumentResponse, DocumentMetadata, DocumentStatus
from ..models.user import UserInDB, UserRole
from ..services.auth_service import AuthService
from ..routers.auth import get_current_user
from ..utils.database import get_database, get_gridfs
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["Upload"])

def validate_file(filename: str, file_size: int):
    """Validate file type and size"""
    # Check file extension
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Check file size
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE_MB}MB"
        )

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """Upload a document for OCR processing"""
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Validate file
        validate_file(file.filename, file_size)
        
        # Check user upload limit
        db = get_database()
        auth_service = AuthService(db)
        
        if current_user.role == UserRole.MEMBER:
            if current_user.upload_count >= settings.AUTHENTICATED_UPLOAD_LIMIT:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Upload limit reached"
                )
        
        # Store file in GridFS
        gridfs = get_gridfs()
        
        file_id = await gridfs.upload_from_stream(
            file.filename,
            content,
            metadata={
                "user_id": current_user.id,
                "original_filename": file.filename,
                "mime_type": file.content_type,
                "upload_date": datetime.utcnow()
            }
        )
        
        # Create document metadata
        metadata = DocumentMetadata(
            filename=f"{uuid.uuid4()}_{file.filename}",
            original_filename=file.filename,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            upload_date=datetime.utcnow()
        )
        
        # Create document record
        document_data = {
            "user_id": current_user.id,
            "gridfs_id": str(file_id),
            "metadata": metadata.dict(),
            "status": DocumentStatus.UPLOADED.value,
            "ocr_results": [],
            "tables": [],
            "embeddings_generated": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.documents.insert_one(document_data)
        document_data["_id"] = str(result.inserted_id)
        
        # Update user upload count and storage
        await auth_service.increment_upload_count(current_user.id)
        await auth_service.update_storage_used(current_user.id, file_size)
        
        # Log to audit
        await db.audit_logs.insert_one({
            "user_id": current_user.id,
            "action": "document_upload",
            "document_id": str(result.inserted_id),
            "timestamp": datetime.utcnow(),
            "details": {
                "filename": file.filename,
                "size": file_size
            }
        })
        
        logger.info(f"Document uploaded: {result.inserted_id} by user {current_user.id}")
        
        return DocumentResponse(
            _id=str(result.inserted_id),
            user_id=current_user.id,
            metadata=metadata,
            status=DocumentStatus.UPLOADED,
            created_at=document_data["created_at"],
            updated_at=document_data["updated_at"]
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/guest-upload")
async def guest_upload_info():
    """Get information about guest upload limitations"""
    return {
        "allowed": True,
        "max_files": settings.GUEST_UPLOAD_LIMIT,
        "max_size_mb": settings.MAX_FILE_SIZE_MB,
        "allowed_formats": settings.allowed_extensions_list,
        "limitations": {
            "no_history": True,
            "limited_metadata": True,
            "auto_delete": "Files deleted after session ends"
        }
    }

@router.get("/my-documents", response_model=List[DocumentResponse])
async def get_my_documents(
    skip: int = 0,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's uploaded documents"""
    db = get_database()
    
    cursor = db.documents.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    documents = await cursor.to_list(length=limit)
    
    result = []
    for doc in documents:
        doc["_id"] = str(doc["_id"])
        result.append(DocumentResponse(**doc))
    
    return result

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get document by ID"""
    db = get_database()
    
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check ownership (unless admin)
    if document["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    document["_id"] = str(document["_id"])
    return DocumentResponse(**document)

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a document"""
    db = get_database()
    
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check ownership (unless admin)
    if document["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete from GridFS
    gridfs = get_gridfs()
    try:
        await gridfs.delete(document["gridfs_id"])
    except Exception as e:
        logger.error(f"Error deleting file from GridFS: {e}")
    
    # Delete document record
    await db.documents.delete_one({"_id": document_id})
    
    # Delete embeddings
    await db.embeddings.delete_many({"document_id": document_id})
    
    # Update user storage
    auth_service = AuthService(db)
    await auth_service.update_storage_used(
        current_user.id, 
        -document["metadata"]["file_size"]
    )
    
    # Log to audit
    await db.audit_logs.insert_one({
        "user_id": current_user.id,
        "action": "document_delete",
        "document_id": document_id,
        "timestamp": datetime.utcnow()
    })
    
    return None