from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from ..models.user import UserCreate, UserInDB, UserRole, Token
from ..utils.security import get_password_hash, verify_password, create_access_token
from ..utils.database import get_database
from ..config import settings

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db.users
    
    async def create_user(self, user: UserCreate) -> UserInDB:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user document
        user_dict = user.dict()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["is_active"] = True
        user_dict["upload_count"] = 0
        user_dict["query_count"] = 0
        user_dict["storage_used"] = 0
        
        result = await self.users_collection.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        
        return UserInDB(**user_dict)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserInDB]:
        """Authenticate a user"""
        user = await self.users_collection.find_one({"email": email})
        if not user:
            return None
        
        if not verify_password(password, user["hashed_password"]):
            return None
        
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        user["_id"] = str(user["_id"])
        return UserInDB(**user)
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        user = await self.users_collection.find_one({"_id": user_id})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        user = await self.users_collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None
    
    def create_token(self, user: UserInDB) -> Token:
        """Create access token for user"""
        expires_delta = timedelta(
            minutes=settings.ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES 
            if user.role == UserRole.ADMIN 
            else settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        access_token = create_access_token(
            data={
                "sub": user.id,
                "email": user.email,
                "role": user.role.value
            },
            expires_delta=expires_delta
        )
        
        return Token(access_token=access_token)
    
    async def increment_upload_count(self, user_id: str):
        """Increment user's upload count"""
        await self.users_collection.update_one(
            {"_id": user_id},
            {"$inc": {"upload_count": 1}, "$set": {"updated_at": datetime.utcnow()}}
        )
    
    async def increment_query_count(self, user_id: str):
        """Increment user's query count"""
        await self.users_collection.update_one(
            {"_id": user_id},
            {"$inc": {"query_count": 1}, "$set": {"updated_at": datetime.utcnow()}}
        )
    
    async def update_storage_used(self, user_id: str, size_delta: int):
        """Update user's storage usage"""
        await self.users_collection.update_one(
            {"_id": user_id},
            {"$inc": {"storage_used": size_delta}, "$set": {"updated_at": datetime.utcnow()}}
        )