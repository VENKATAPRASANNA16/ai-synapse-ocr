from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime
from pathlib import Path
import asyncio

from ..models.user import UserInDB
from ..routers.auth import get_current_user
from ..utils.database import get_database
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR Processing"])

# Create results directory
RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)

async def simple_process_document(document_id: str):
    """Simple processor with mock results"""
    db = get_database()
    
    try:
        logger.info(f"🚀 Starting processing for {document_id}")
        
        # Create result directory
        result_dir = RESULTS_DIR / document_id
        result_dir.mkdir(exist_ok=True)
        
        # Preprocessing
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": "preprocessing", "updated_at": datetime.utcnow()}}
        )
        await asyncio.sleep(2)
        
        # OCR Processing
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": "ocr_processing", "updated_at": datetime.utcnow()}}
        )
        await asyncio.sleep(2)
        
        # Create mock markdown content
        markdown_content = """## Document Analysis Results

### Summary
This document has been successfully processed using our AI-powered OCR system.

### Key Information
- **Processing Date**: {date}
- **Status**: Completed
- **Pages Analyzed**: 1

### Content Overview
The document contains text that has been extracted and is now searchable. You can ask questions about this document using the AI chat feature.

### Available Features
1. **Text Extraction**: ✓ Completed
2. **Table Detection**: ✓ Analyzed
3. **AI Analysis**: ✓ Ready
4. **Export Options**: ✓ Available

### Next Steps
- View the extracted text above
- Use the "Chat with AI" button to ask questions
- Export data in CSV, Excel, or Word format
""".format(date=datetime.utcnow().strftime('%Y-%m-%d %H:%M'))
        
        # Save markdown
        markdown_path = result_dir / "result.md"
        with open(markdown_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        # Table Extraction
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": "table_extraction", "updated_at": datetime.utcnow()}}
        )
        await asyncio.sleep(2)
        
        # Complete
        result_metadata = {
            "document_id": document_id,
            "processed_at": datetime.utcnow().isoformat(),
            "pages": 1,
            "detection_images": [],
            "original_images": [],
            "tables_count": 0
        }
        
        await db.documents.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": "completed",
                    "result_metadata": result_metadata,
                    "processing_completed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"✅ Completed {document_id}")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": "failed", "error_message": str(e)}}
        )

@router.post("/{document_id}/process")
async def start_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """Start OCR processing"""
    db = get_database()
    
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if document["status"] not in ["uploaded", "failed"]:
        raise HTTPException(status_code=400, detail="Already processing or completed")
    
    background_tasks.add_task(simple_process_document, document_id)
    
    return {"message": "Processing started", "document_id": document_id}

@router.get("/{document_id}/status")
async def get_status(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get status"""
    db = get_database()
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "document_id": document_id,
        "status": document["status"],
        "error_message": document.get("error_message")
    }

@router.get("/{document_id}/results")
async def get_results(
    document_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get results"""
    db = get_database()
    document = await db.documents.find_one({"_id": document_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if document["status"] != "completed":
        raise HTTPException(status_code=400, detail="Not completed yet")
    
    # Read markdown
    result_dir = RESULTS_DIR / document_id
    markdown_path = result_dir / "result.md"
    
    markdown_text = ""
    if markdown_path.exists():
        with open(markdown_path, 'r', encoding='utf-8') as f:
            markdown_text = f.read()
    
    metadata = document.get('result_metadata', {})
    
    return {
        "document_id": document_id,
        "documentName": document["metadata"]["original_filename"],
        "status": "completed",
        "extractedText": markdown_text,
        "pages": metadata.get('pages', 1),
        "processedDate": document.get("processing_completed_at", datetime.utcnow()).strftime('%Y-%m-%d'),
        "detectionImages": [],
        "originalImages": [],
        "tablesCount": 0
    }