"""
Authentication and authorization utilities.

Provides password hashing, JWT token management, and FastAPI dependencies
for protecting routes with authentication and role-based access control.
"""

from auth.password import hash_password, verify_password
from auth.jwt import create_access_token, create_refresh_token, decode_token
from auth.dependencies import (
    get_current_user,
    get_current_active_user,
    RoleChecker,
    require_admin,
    require_sales,
)

__all__ = [
    # Password utilities
    "hash_password",
    "verify_password",
    # JWT utilities
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    # FastAPI dependencies
    "get_current_user",
    "get_current_active_user",
    "RoleChecker",
    "require_admin",
    "require_sales",
]
