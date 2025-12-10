from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Optional, List
from bson import ObjectId
import asyncio
import io
from PIL import Image
import numpy as np
import os
from datetime import datetime

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
    """Enhanced background processing with better error handling"""
    db = get_database()
    gridfs = get_gridfs()
    
    logger.info(f"=" * 70)
    logger.info(f"🚀 BACKGROUND PROCESSING STARTED for {document_id}")
    logger.info(f"=" * 70)
    
    try:
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
        
        logger.info("✅ Status updated to PREPROCESSING")
        
        # Get document
        document = await db.documents.find_one({"_id": document_id})
        if not document:
            raise Exception("Document not found in database")
        
        filename = document['metadata']['original_filename']
        logger.info(f"📄 Document: {filename}")
        logger.info(f"📄 GridFS ID: {document['gridfs_id']}")
        
        # Download from GridFS
        try:
            grid_out = await gridfs.open_download_stream(ObjectId(document["gridfs_id"]))
            file_data = await grid_out.read()
            logger.info(f"📥 Downloaded {len(file_data)} bytes from GridFS")
        except Exception as e:
            logger.error(f"❌ Failed to download from GridFS: {e}")
            raise Exception(f"Failed to download file from storage: {e}")
        
        # Convert to images
        images = []
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.pdf'):
            logger.info("📑 Processing PDF file...")
            import tempfile
            import pdf2image
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            
            try:
                # Try high DPI first
                images = await preprocessing_service.convert_pdf_to_images(tmp_path, dpi=300)
                logger.info(f"✅ Converted PDF at 300 DPI: {len(images)} pages")
            except Exception as e:
                logger.warning(f"⚠️ Failed at 300 DPI, trying 150 DPI: {e}")
                try:
                    images = await preprocessing_service.convert_pdf_to_images(tmp_path, dpi=150)
                    logger.info(f"✅ Converted PDF at 150 DPI: {len(images)} pages")
                except Exception as e2:
                    logger.error(f"❌ PDF conversion failed: {e2}")
                    raise Exception(f"Failed to convert PDF: {e2}")
            finally:
                os.unlink(tmp_path)
        
        else:
            logger.info("🖼️ Processing image file...")
            try:
                image = Image.open(io.BytesIO(file_data))
                # Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                images = [np.array(image)]
                logger.info(f"✅ Loaded image: {image.size}")
            except Exception as e:
                logger.error(f"❌ Failed to load image: {e}")
                raise Exception(f"Failed to load image: {e}")
        
        if not images or len(images) == 0:
            raise Exception("No images were loaded from the document")
        
        logger.info(f"📊 Total pages to process: {len(images)}")
        
        # Update page count
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"metadata.page_count": len(images)}}
        )
        
        # Preprocess images with enhanced settings
        logger.info("🔄 Preprocessing images...")
        preprocessed_images = []
        
        for i, img in enumerate(images, 1):
            logger.info(f"  📄 Processing page {i}/{len(images)}")
            logger.info(f"     Original size: {img.shape}")
            
            # Enhanced preprocessing
            processed = await preprocessing_service.preprocess_image(img)
            
            logger.info(f"     Processed size: {processed.shape}")
            preprocessed_images.append(processed)
        
        logger.info("✅ All pages preprocessed")
        
        # OCR Processing
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.OCR_PROCESSING.value}}
        )
        
        logger.info("🔍 Starting OCR extraction...")
        logger.info(f"   Using multi-engine OCR (Tesseract + PaddleOCR)")
        
        ocr_results = await ocr_service.process_document(
            preprocessed_images,
            use_multi_engine=True
        )
        
        # Log detailed OCR results
        total_chars = 0
        for i, result in enumerate(ocr_results, 1):
            char_count = len(result.text) if result.text else 0
            total_chars += char_count
            logger.info(f"   Page {i}: {char_count} chars, engine={result.engine.value}, confidence={result.confidence:.2f}")
            
            # Show preview of extracted text
            if result.text and len(result.text) > 0:
                preview = result.text[:100].replace('\n', ' ')
                logger.info(f"   Preview: {preview}...")
            else:
                logger.warning(f"   ⚠️ No text extracted from page {i}!")
        
        logger.info(f"✅ OCR completed: {total_chars} total characters extracted")
        
        if total_chars == 0:
            logger.error("❌ NO TEXT WAS EXTRACTED FROM ANY PAGE!")
            logger.error("   This could mean:")
            logger.error("   1. The PDF contains only images")
            logger.error("   2. The image quality is too poor")
            logger.error("   3. OCR engines failed")
            # Don't fail completely, continue processing
        
        # Save OCR results
        ocr_results_dict = [result.dict() for result in ocr_results]
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"ocr_results": ocr_results_dict}}
        )
        logger.info("💾 OCR results saved to database")
        
        # Table Extraction
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.TABLE_EXTRACTION.value}}
        )
        
        logger.info("📊 Extracting tables...")
        tables = await table_service.process_document_tables(
            preprocessed_images,
            ocr_results
        )
        
        logger.info(f"✅ Found {len(tables)} table(s)")
        
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
        
        logger.info("🧠 Generating embeddings...")
        
        try:
            embeddings_data = await embedding_service.create_document_embeddings(
                ocr_results,
                tables
            )
            
            logger.info(f"✅ Generated {len(embeddings_data)} embedding(s)")
            
            # Save embeddings
            if embeddings_data:
                for emb in embeddings_data:
                    emb['document_id'] = document_id
                await db.embeddings.insert_many(embeddings_data)
                logger.info("💾 Embeddings saved to database")
            else:
                logger.warning("⚠️ No embeddings were generated (might be due to no text)")
        
        except Exception as e:
            logger.error(f"⚠️ Embedding generation failed: {e}")
            # Continue anyway
        
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
        
        logger.info(f"=" * 70)
        logger.info(f"✅ PROCESSING COMPLETED SUCCESSFULLY")
        logger.info(f"   Document ID: {document_id}")
        logger.info(f"   Pages: {len(images)}")
        logger.info(f"   Text extracted: {total_chars} characters")
        logger.info(f"   Tables: {len(tables)}")
        logger.info(f"   Embeddings: {len(embeddings_data) if 'embeddings_data' in locals() else 0}")
        logger.info(f"=" * 70)
    
    except Exception as e:
        logger.error(f"=" * 70)
        logger.error(f"❌ PROCESSING FAILED")
        logger.error(f"   Document ID: {document_id}")
        logger.error(f"   Error: {str(e)}")
        logger.error(f"=" * 70)
        logger.exception("Full traceback:")
        
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
    current_user: UserInDB = Depends(get_current_user)
):
    """Start OCR processing"""
    db = get_database()
    
    logger.info(f"🎯 OCR process request for: {document_id}")
    
    # Check document
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(403, detail="Access denied")
    
    if document["status"] not in [DocumentStatus.UPLOADED.value, DocumentStatus.FAILED.value]:
        raise HTTPException(400, detail=f"Document status: {document['status']}")
    
    # Start background task
    background_tasks.add_task(process_document_background, document_id)
    logger.info("✅ Background task added")
    
    return {
        "message": "Processing started",
        "document_id": document_id,
        "status": "processing"
    }

@router.get("/{document_id}/status")
async def get_processing_status(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get processing status"""
    db = get_database()
    
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(403, detail="Access denied")
    
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

@router.get("/{document_id}/page/{page_number}/image")
async def get_page_image(
    document_id: str,
    page_number: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get original page image"""
    from fastapi.responses import Response
    import tempfile
    import os
    
    db = get_database()
    gridfs = get_gridfs()
    
    # Check access
    document = await db.documents.find_one({"_id": document_id})
    if not document:
        raise HTTPException(404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(403, detail="Access denied")
    
    try:
        # Download file
        grid_out = await gridfs.open_download_stream(ObjectId(document["gridfs_id"]))
        file_data = await grid_out.read()
        
        # Convert to image
        filename = document['metadata']['original_filename'].lower()
        
        if filename.endswith('.pdf'):
            # Convert PDF page to image
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            
            try:
                images = await preprocessing_service.convert_pdf_to_images(tmp_path, dpi=150)
                
                if page_number < 1 or page_number > len(images):
                    raise HTTPException(400, detail="Invalid page number")
                
                # Get the requested page (1-indexed)
                page_image = images[page_number - 1]
                
                # Convert numpy array to PNG bytes
                from PIL import Image as PILImage
                import io
                
                img = PILImage.fromarray(page_image)
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                
                return Response(content=img_bytes.read(), media_type="image/png")
                
            finally:
                os.unlink(tmp_path)
        
        else:
            # Return image directly
            return Response(content=file_data, media_type="image/png")
            
    except Exception as e:
        logger.error(f"Failed to get page image: {e}")
        raise HTTPException(500, detail=str(e))

@router.get("/{document_id}/results", response_model=DocumentDetailResponse)
async def get_ocr_results(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get OCR results"""
    db = get_database()
    
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(403, detail="Access denied")
    
    if document["status"] != DocumentStatus.COMPLETED.value:
        raise HTTPException(400, detail="Processing not completed")
    
    document["_id"] = str(document["_id"])
    
    # Calculate processing time
    if document.get("processing_started_at") and document.get("processing_completed_at"):
        delta = document["processing_completed_at"] - document["processing_started_at"]
        document["processing_time"] = delta.total_seconds()
    
    return DocumentDetailResponse(**document)