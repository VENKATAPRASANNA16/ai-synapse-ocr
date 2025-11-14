from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict

from ..models.user import UserInDB, UserRole
from ..routers.auth import get_current_user
from ..utils.database import get_database
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

async def require_admin(current_user: UserInDB = Depends(get_current_user)):
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: UserInDB = Depends(require_admin)
):
    """Get overall system statistics"""
    db = get_database()
    
    try:
        # Total documents
        total_documents = await db.documents.count_documents({})
        
        # Documents by status
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        status_counts = await db.documents.aggregate(pipeline).to_list(length=None)
        
        # Total users
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"is_active": True})
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_uploads = await db.documents.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        recent_queries = await db.query_history.count_documents({
            "timestamp": {"$gte": thirty_days_ago}
        })
        
        # OCR accuracy stats
        pipeline = [
            {"$unwind": "$ocr_results"},
            {
                "$group": {
                    "_id": None,
                    "avg_confidence": {"$avg": "$ocr_results.confidence"},
                    "total_pages": {"$sum": 1}
                }
            }
        ]
        accuracy_stats = await db.documents.aggregate(pipeline).to_list(length=1)
        
        avg_accuracy = accuracy_stats[0]["avg_confidence"] if accuracy_stats else 0.0
        total_pages = accuracy_stats[0]["total_pages"] if accuracy_stats else 0
        
        # Processing time stats
        pipeline = [
            {
                "$match": {
                    "processing_started_at": {"$exists": True},
                    "processing_completed_at": {"$exists": True}
                }
            },
            {
                "$project": {
                    "processing_time": {
                        "$divide": [
                            {"$subtract": ["$processing_completed_at", "$processing_started_at"]},
                            1000
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_time": {"$avg": "$processing_time"}
                }
            }
        ]
        time_stats = await db.documents.aggregate(pipeline).to_list(length=1)
        avg_processing_time = time_stats[0]["avg_time"] if time_stats else 0.0
        
        # Storage usage
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_storage": {"$sum": "$storage_used"}
                }
            }
        ]
        storage_stats = await db.users.aggregate(pipeline).to_list(length=1)
        total_storage = storage_stats[0]["total_storage"] if storage_stats else 0
        
        return {
            "documents": {
                "total": total_documents,
                "by_status": {item["_id"]: item["count"] for item in status_counts},
                "recent_uploads": recent_uploads
            },
            "users": {
                "total": total_users,
                "active": active_users
            },
            "processing": {
                "total_pages_processed": total_pages,
                "avg_accuracy": round(avg_accuracy * 100, 2),
                "avg_processing_time": round(avg_processing_time, 2)
            },
            "queries": {
                "recent_queries": recent_queries
            },
            "storage": {
                "total_bytes": total_storage,
                "total_mb": round(total_storage / (1024 * 1024), 2),
                "total_gb": round(total_storage / (1024 * 1024 * 1024), 2)
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )

@router.get("/ocr-performance")
async def get_ocr_performance(
    days: int = 30,
    current_user: UserInDB = Depends(require_admin)
):
    """Get OCR performance metrics over time"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date},
                "status": "completed"
            }
        },
        {
            "$project": {
                "date": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at"
                    }
                },
                "ocr_results": 1
            }
        },
        {"$unwind": "$ocr_results"},
        {
            "$group": {
                "_id": {
                    "date": "$date",
                    "engine": "$ocr_results.engine"
                },
                "avg_confidence": {"$avg": "$ocr_results.confidence"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.date": 1}}
    ]
    
    results = await db.documents.aggregate(pipeline).to_list(length=None)
    
    # Format results
    performance_data = defaultdict(lambda: defaultdict(dict))
    
    for item in results:
        date = item["_id"]["date"]
        engine = item["_id"]["engine"]
        performance_data[date][engine] = {
            "avg_confidence": round(item["avg_confidence"] * 100, 2),
            "count": item["count"]
        }
    
    return {
        "period_days": days,
        "data": dict(performance_data)
    }

@router.get("/user-activity")
async def get_user_activity(
    limit: int = 50,
    current_user: UserInDB = Depends(require_admin)
):
    """Get recent user activity"""
    db = get_database()
    
    cursor = db.audit_logs.find({}).sort("timestamp", -1).limit(limit)
    activities = await cursor.to_list(length=limit)
    
    # Format activities
    formatted_activities = []
    for activity in activities:
        # Get user info
        user = await db.users.find_one({"_id": activity["user_id"]})
        
        formatted_activities.append({
            "timestamp": activity["timestamp"].isoformat(),
            "user_email": user["email"] if user else "Unknown",
            "action": activity["action"],
            "details": activity.get("details", {})
        })
    
    return formatted_activities

@router.get("/document-types")
async def get_document_types_distribution(
    current_user: UserInDB = Depends(require_admin)
):
    """Get distribution of document types"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": "$metadata.mime_type",
                "count": {"$sum": 1},
                "total_size": {"$sum": "$metadata.file_size"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    results = await db.documents.aggregate(pipeline).to_list(length=None)
    
    return [
        {
            "type": item["_id"],
            "count": item["count"],
            "total_size_mb": round(item["total_size"] / (1024 * 1024), 2)
        }
        for item in results
    ]

@router.get("/error-analysis")
async def get_error_analysis(
    days: int = 7,
    current_user: UserInDB = Depends(require_admin)
):
    """Get error analysis"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Failed documents
    failed_docs = await db.documents.find({
        "status": "failed",
        "updated_at": {"$gte": start_date}
    }).to_list(length=100)
    
    # Analyze error messages
    error_categories = defaultdict(int)
    for doc in failed_docs:
        error_msg = doc.get("error_message", "Unknown error")
        # Simple categorization
        if "timeout" in error_msg.lower():
            error_categories["Timeout"] += 1
        elif "memory" in error_msg.lower():
            error_categories["Memory"] += 1
        elif "format" in error_msg.lower():
            error_categories["Format"] += 1
        else:
            error_categories["Other"] += 1
    
    return {
        "period_days": days,
        "total_failures": len(failed_docs),
        "error_categories": dict(error_categories),
        "recent_errors": [
            {
                "document_id": str(doc["_id"]),
                "timestamp": doc["updated_at"].isoformat(),
                "error": doc.get("error_message", "Unknown")[:200]
            }
            for doc in failed_docs[:10]
        ]
    }

@router.get("/my-stats")
async def get_my_statistics(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's statistics"""
    db = get_database()
    
    # User's documents
    total_docs = await db.documents.count_documents({"user_id": current_user.id})
    completed_docs = await db.documents.count_documents({
        "user_id": current_user.id,
        "status": "completed"
    })
    
    # User's queries
    total_queries = await db.query_history.count_documents({"user_id": current_user.id})
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_docs = await db.documents.count_documents({
        "user_id": current_user.id,
        "created_at": {"$gte": seven_days_ago}
    })
    
    recent_queries = await db.query_history.count_documents({
        "user_id": current_user.id,
        "timestamp": {"$gte": seven_days_ago}
    })
    
    # Average accuracy
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$unwind": "$ocr_results"},
        {
            "$group": {
                "_id": None,
                "avg_confidence": {"$avg": "$ocr_results.confidence"}
            }
        }
    ]
    accuracy_stats = await db.documents.aggregate(pipeline).to_list(length=1)
    avg_accuracy = accuracy_stats[0]["avg_confidence"] if accuracy_stats else 0.0
    
    return {
        "documents": {
            "total": total_docs,
            "completed": completed_docs,
            "recent_7_days": recent_docs
        },
        "queries": {
            "total": total_queries,
            "recent_7_days": recent_queries
        },
        "accuracy": {
            "average": round(avg_accuracy * 100, 2)
        },
        "storage": {
            "used_mb": round(current_user.storage_used / (1024 * 1024), 2)
        },
        "limits": {
            "uploads_remaining": max(0, settings.AUTHENTICATED_UPLOAD_LIMIT - current_user.upload_count),
            "queries_remaining": max(0, settings.AUTHENTICATED_QUERY_LIMIT - current_user.query_count)
        }
    }