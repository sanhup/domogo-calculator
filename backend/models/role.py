"""
Role model for user authorization.

Represents a role that can be assigned to users for access control.
Supports many-to-many relationship with users through UserRole association.

Attributes:
    id: Primary key
    name: Unique role name (e.g., 'admin', 'sales', 'user')
    description: Human-readable description of role permissions
    archived: Soft delete flag (default False)
    created_at: Timestamp when role was created (from TimestampMixin)
    updated_at: Timestamp when role was last updated (from TimestampMixin)
    users: Relationship to User model through UserRole association
"""

from sqlalchemy import Column, Integer, String, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
from models.mixins import TimestampMixin


class Role(Base, TimestampMixin):
    """
    Role model representing access control roles in the system.

    Inherits created_at and updated_at fields from TimestampMixin.
    Uses soft delete pattern with 'archived' field.

    Example roles: 'admin', 'sales', 'user'
    """

    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    archived = Column(Boolean, default=False, nullable=False, index=True)

    # Timestamps inherited from TimestampMixin:
    # - created_at
    # - updated_at

    # Relationships
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}', archived={self.archived})>"
