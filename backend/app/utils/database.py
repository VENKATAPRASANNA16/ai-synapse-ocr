from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from typing import Optional
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    gridfs: Optional[AsyncIOMotorGridFSBucket] = None

db = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=5000  # 5 seconds timeout
        )
        db.db = db.client[settings.MONGODB_DB_NAME]
        db.gridfs = AsyncIOMotorGridFSBucket(db.db)
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        logger.info(f"Using database: {settings.MONGODB_DB_NAME}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("Closed MongoDB connection")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")

async def create_indexes():
    """Create database indexes"""
    try:
        # Users collection
        await db.db.users.create_index("email", unique=True)
        await db.db.users.create_index("created_at")
        
        # Documents collection
        await db.db.documents.create_index("user_id")
        await db.db.documents.create_index("created_at")
        await db.db.documents.create_index("status")
        
        # Audit logs collection
        await db.db.audit_logs.create_index("user_id")
        await db.db.audit_logs.create_index("timestamp")
        await db.db.audit_logs.create_index("action")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def get_database():
    if db.db is None:
        raise Exception("Database not initialized. Call connect_to_mongo() first.")
    return db.db

def get_gridfs():
    if db.gridfs is None:
        raise Exception("GridFS not initialized. Call connect_to_mongo() first.")
    return db.gridfs