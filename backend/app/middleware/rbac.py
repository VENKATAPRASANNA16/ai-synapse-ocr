from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Dict
import logging

from ..models.user import UserRole

logger = logging.getLogger(__name__)

class RBACMiddleware(BaseHTTPMiddleware):
    """Role-Based Access Control Middleware"""
    
    # Define role permissions for endpoints
    ROLE_PERMISSIONS: Dict[str, List[UserRole]] = {
        "/api/analytics": [UserRole.ADMIN],
        "/api/admin": [UserRole.ADMIN],
    }
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public endpoints
        if request.url.path in ["/", "/docs", "/redoc", "/openapi.json", "/api/auth/login", "/api/auth/register"]:
            return await call_next(request)
        
        # Get user from request state (set by auth dependency)
        user = getattr(request.state, "user", None)
        
        # Check role-based permissions
        for path_prefix, allowed_roles in self.ROLE_PERMISSIONS.items():
            if request.url.path.startswith(path_prefix):
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication required"
                    )
                
                if user.role not in allowed_roles:
                    logger.warning(f"Access denied for user {user.id} to {request.url.path}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Access denied. Required role: {', '.join([r.value for r in allowed_roles])}"
                    )
        
        response = await call_next(request)
        return response