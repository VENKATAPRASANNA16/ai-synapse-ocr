from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from ..config import settings
import logging

logger = logging.getLogger(__name__)

# Database instances
_client: AsyncIOMotorClient = None
_db = None
_gridfs = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global _client, _db, _gridfs
    
    try:
        mongodb_url = settings.get_mongodb_url()  # Use the method
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_HOST}:{settings.MONGODB_PORT}")
        
        _client = AsyncIOMotorClient(
            mongodb_url,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE
        )
        
        # Test connection
        await _client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        _db = _client[settings.MONGODB_DB_NAME]
        logger.info(f"Using database: {settings.MONGODB_DB_NAME}")
        
        # Initialize GridFS
        _gridfs = AsyncIOMotorGridFSBucket(_db)
        
        # Create indexes
        await create_indexes()
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        logger.info("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return _db

def get_gridfs():
    """Get GridFS instance"""
    return _gridfs

async def create_indexes():
    """Create database indexes"""
    # Users collection indexes
    await _db.users.create_index("email", unique=True)
    await _db.users.create_index("created_at")
    
    # Documents collection indexes
    await _db.documents.create_index("user_id")
    await _db.documents.create_index("status")
    await _db.documents.create_index("created_at")
    await _db.documents.create_index([("user_id", 1), ("created_at", -1)])
    
    # Embeddings collection indexes
    await _db.embeddings.create_index("document_id")
    await _db.embeddings.create_index([("document_id", 1), ("chunk_index", 1)])
    
    # Queries collection indexes
    await _db.queries.create_index("user_id")
    await _db.queries.create_index("document_id")
    await _db.queries.create_index("timestamp")