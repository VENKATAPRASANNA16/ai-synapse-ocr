from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List, Optional
import aiofiles
import os
from datetime import datetime
import uuid
from bson import ObjectId

from ..models.document import DocumentCreate, DocumentResponse, DocumentMetadata, DocumentStatus
from ..models.user import UserInDB, UserRole
from ..services.auth_service import AuthService
from ..routers.auth import get_current_user
from ..utils.database import get_database, get_gridfs
from ..config import settings
import logging

logger = logging.getLogger(__name__)

# IMPORTANT: Remove /api/upload from here since it's added in main.py
router = APIRouter()

def validate_file(filename: str, file_size: int):
    """Validate file type and size"""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    allowed_extensions = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp']
    
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    max_size_bytes = 50 * 1024 * 1024  # 50MB
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of 50MB"
        )

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """Upload a document for OCR processing"""
    try:
        logger.info(f"Upload request from user: {current_user.id}")
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        logger.info(f"File received: {file.filename}, size: {file_size}")
        
        # Validate file
        validate_file(file.filename, file_size)
        
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
        
        logger.info(f"File stored in GridFS with ID: {file_id}")
        
        # Create document metadata
        metadata = DocumentMetadata(
            filename=f"{uuid.uuid4()}_{file.filename}",
            original_filename=file.filename,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            upload_date=datetime.utcnow()
        )
        
        # Create document record
        db = get_database()
        document_data = {
            "_id": str(uuid.uuid4()),
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
        
        await db.documents.insert_one(document_data)
        
        logger.info(f"Document created: {document_data['_id']}")
        
        # Update user upload count
        auth_service = AuthService(db)
        await auth_service.increment_upload_count(current_user.id)
        await auth_service.update_storage_used(current_user.id, file_size)
        
        return DocumentResponse(
            _id=document_data["_id"],
            user_id=current_user.id,
            metadata=metadata,
            status=DocumentStatus.UPLOADED,
            created_at=document_data["created_at"],
            updated_at=document_data["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/my-documents")
async def get_my_documents(
    skip: int = 0,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's uploaded documents"""
    try:
        logger.info(f"Fetching documents for user: {current_user.id}")
        
        db = get_database()
        
        cursor = db.documents.find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        documents = await cursor.to_list(length=limit)
        
        logger.info(f"Found {len(documents)} documents")
        
        return documents
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documents: {str(e)}"
        )

@router.get("/{document_id}")
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
    
    if document["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return document

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
    
    if document["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete from GridFS
    gridfs = get_gridfs()
    try:
        await gridfs.delete(ObjectId(document["gridfs_id"]))
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
    
    return None