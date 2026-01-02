"""
Pydantic schemas for role management requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class RoleCreate(BaseModel):
    """Schema for creating a new role."""
    name: str = Field(..., min_length=2, max_length=50)
    description: str | None = None


class RoleUpdate(BaseModel):
    """Schema for updating role information."""
    name: str | None = Field(None, min_length=2, max_length=50)
    description: str | None = None


class RoleResponse(BaseModel):
    """Schema for role information in responses."""
    id: int
    name: str
    description: str | None
    archived: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """Schema for role list response."""
    roles: List[RoleResponse]
    total: int
