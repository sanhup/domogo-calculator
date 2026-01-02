"""
FastAPI dependencies for authentication and authorization.

Provides dependency functions for protecting routes and verifying user permissions.
Used as dependencies in FastAPI route decorators.

Dependencies:
    get_current_user: Verify JWT token and return current user
    require_role: Verify user has required role(s)
    get_current_active_user: Verify user is active
"""

from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from auth.jwt import decode_token
from logging_config import get_logger

logger = get_logger(__name__)

# HTTP Bearer token authentication scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Verify JWT token and return the current authenticated user.

    Args:
        credentials: HTTP Authorization header with Bearer token
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found

    Example:
        @app.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            return {"user": current_user.username}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = decode_token(token, token_type="access")

        if payload is None:
            logger.warning("Invalid token provided")
            raise credentials_exception

        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("Token missing user ID")
            raise credentials_exception

    except Exception as e:
        logger.error("Token validation failed", extra={"error": str(e)})
        raise credentials_exception

    # Fetch user from database
    user = db.query(User).filter(User.id == int(user_id), User.archived == False).first()

    if user is None:
        logger.warning("User not found or archived", extra={"user_id": user_id})
        raise credentials_exception

    logger.info("User authenticated", extra={
        "user_id": user.id,
        "username": user.username
    })

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is active (not disabled).

    Args:
        current_user: Current authenticated user

    Returns:
        User: Current active user

    Raises:
        HTTPException: If user is inactive

    Example:
        @app.get("/active-only")
        async def active_route(user: User = Depends(get_current_active_user)):
            return {"status": "active"}
    """
    if not current_user.is_active:
        logger.warning("Inactive user attempted access", extra={
            "user_id": current_user.id,
            "username": current_user.username
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return current_user


class RoleChecker:
    """
    Dependency class for checking if user has required role(s).

    Usage:
        @app.get("/admin")
        async def admin_route(user: User = Depends(RoleChecker(["admin"]))):
            return {"message": "Admin access granted"}
    """

    def __init__(self, required_roles: List[str]):
        """
        Initialize role checker with required roles.

        Args:
            required_roles: List of role names required (user needs at least one)
        """
        self.required_roles = required_roles

    async def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        """
        Verify user has at least one of the required roles.

        Args:
            current_user: Current active user

        Returns:
            User: Current user with verified role

        Raises:
            HTTPException: If user lacks required role
        """
        user_roles = current_user.roles

        if not any(role in self.required_roles for role in user_roles):
            logger.warning("User lacks required role", extra={
                "user_id": current_user.id,
                "username": current_user.username,
                "user_roles": user_roles,
                "required_roles": self.required_roles
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role(s): {', '.join(self.required_roles)}"
            )

        logger.info("Role check passed", extra={
            "user_id": current_user.id,
            "username": current_user.username,
            "role_checked": self.required_roles
        })

        return current_user


# Convenience dependency instances for common roles
require_admin = RoleChecker(["admin"])
require_sales = RoleChecker(["admin", "sales"])
