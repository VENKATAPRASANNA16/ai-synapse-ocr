from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Optional, List
from bson import ObjectId
import asyncio
import io
from PIL import Image

from ..models.document import DocumentStatus, DocumentDetailResponse, OCREngine
from ..models.user import UserInDB
from ..routers.auth import get_current_user
from ..services.ocr_service import OCRService
from ..services.preprocessing_service import PreprocessingService
from ..services.table_detection_service import TableDetectionService
from ..services.embedding_service import EmbeddingService
from ..utils.database import get_database, get_gridfs
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR Processing"])

# Initialize services
ocr_service = OCRService()
preprocessing_service = PreprocessingService()
table_service = TableDetectionService()
embedding_service = EmbeddingService()

async def process_document_background(document_id: str):
    """Background task to process document"""
    db = get_database()
    gridfs = get_gridfs()
    
    try:
        logger.info(f"Starting OCR processing for document {document_id}")
        
        # Update status
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.PREPROCESSING.value,
                    "processing_started_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Get document
        document = await db.documents.find_one({"_id": document_id})
        if not document:
            raise Exception("Document not found")
        
        # Download file from GridFS
        grid_out = await gridfs.open_download_stream(ObjectId(document["gridfs_id"]))
        file_data = await grid_out.read()
        
        # Determine file type and convert to images
        filename = document["metadata"]["original_filename"]
        
        if filename.lower().endswith('.pdf'):
            # Save temporarily and convert
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            
            images = await preprocessing_service.convert_pdf_to_images(tmp_path)
            os.unlink(tmp_path)
        else:
            # Single image
            image = Image.open(io.BytesIO(file_data))
            images = [np.array(image)]
        
        # Update page count
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"metadata.page_count": len(images)}}
        )
        
        # Preprocess images
        preprocessed_images = []
        for img in images:
            processed = await preprocessing_service.preprocess_image(img)
            preprocessed_images.append(processed)
        
        # OCR Processing
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.OCR_PROCESSING.value}}
        )
        
        ocr_results = await ocr_service.process_document(
            preprocessed_images,
            use_multi_engine=True
        )
        
        # Save OCR results
        ocr_results_dict = [result.dict() for result in ocr_results]
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"ocr_results": ocr_results_dict}}
        )
        
        # Table Extraction
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.TABLE_EXTRACTION.value}}
        )
        
        tables = await table_service.process_document_tables(
            preprocessed_images,
            ocr_results
        )
        
        # Save tables
        tables_dict = [table.dict() for table in tables]
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "tables": tables_dict,
                    "metadata.table_count": len(tables)
                }
            }
        )
        
        # Embedding Generation
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.EMBEDDING_GENERATION.value}}
        )
        
        embeddings_data = await embedding_service.create_document_embeddings(
            ocr_results,
            tables
        )
        
        # Save embeddings
        for emb in embeddings_data:
            emb['document_id'] = document_id
            await db.embeddings.insert_one(emb)
        
        # Mark as completed
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.COMPLETED.value,
                    "embeddings_generated": True,
                    "processing_completed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Document {document_id} processed successfully")
    
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        
        # Mark as failed
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.FAILED.value,
                    "error_message": str(e),
                    "updated_at": datetime.utcnow()
                }
            }
        )

@router.post("/{document_id}/process")
async def start_ocr_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    engines: Optional[List[OCREngine]] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """Start OCR processing for a document"""
    db = get_database()
    
    # Check document exists and belongs to user
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
    
    if document["status"] not in [DocumentStatus.UPLOADED.value, DocumentStatus.FAILED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is already being processed or completed (status: {document['status']})"
        )
    
    # Start background processing
    background_tasks.add_task(process_document_background, document_id)
    
    return {
        "message": "OCR processing started",
        "document_id": document_id,
        "status": "processing"
    }

@router.get("/{document_id}/status")
async def get_processing_status(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get OCR processing status"""
    db = get_database()
    
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
    
    return {
        "document_id": document_id,
        "status": document["status"],
        "page_count": document["metadata"].get("page_count", 0),
        "table_count": document["metadata"].get("table_count", 0),
        "embeddings_generated": document.get("embeddings_generated", False),
        "processing_started_at": document.get("processing_started_at"),
        "processing_completed_at": document.get("processing_completed_at"),
        "error_message": document.get("error_message")
    }

@router.get("/{document_id}/results", response_model=DocumentDetailResponse)
async def get_ocr_results(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get detailed OCR results"""
    db = get_database()
    
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
    
    if document["status"] != DocumentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document processing not completed"
        )
    
    document["_id"] = str(document["_id"])
    
    # Calculate processing time
    if document.get("processing_started_at") and document.get("processing_completed_at"):
        delta = document["processing_completed_at"] - document["processing_started_at"]
        document["processing_time"] = delta.total_seconds()
    
    return DocumentDetailResponse(**document)