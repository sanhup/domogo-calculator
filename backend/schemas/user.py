"""
Pydantic schemas for user management requests and responses.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: EmailStr | None = None
    full_name: str | None = None
    is_active: bool | None = None


class UserPasswordUpdate(BaseModel):
    """Schema for updating user password."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class UserRolesUpdate(BaseModel):
    """Schema for updating user roles."""
    role_ids: List[int]


class UserResponse(BaseModel):
    """Schema for user information in responses."""
    id: int
    username: str
    email: str
    full_name: str | None
    is_active: bool
    archived: bool
    roles: List[str]
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for user list response."""
    users: List[UserResponse]
    total: int
