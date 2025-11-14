from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional

from ..models.user import UserCreate, UserResponse, Token, UserInDB
from ..services.auth_service import AuthService
from ..utils.database import get_database
from ..utils.security import validate_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_auth_service():
    db = get_database()
    return AuthService(db)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserInDB:
    """Get current authenticated user"""
    payload = validate_token(token)
    user_id = payload.get("sub")
    
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    try:
        user = await auth_service.create_user(user_data)
        return UserResponse(**user.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login and get access token"""
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_service.create_token(user)
    return token

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user.dict())

@router.post("/logout")
async def logout(current_user: UserInDB = Depends(get_current_user)):
    """Logout (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.get("/guest-session")
async def create_guest_session():
    """Create a temporary guest session"""
    return {
        "session_id": "guest_session",
        "role": "guest",
        "limitations": {
            "max_uploads": 1,
            "max_queries": 3,
            "session_duration": "1 hour"
        }
    }