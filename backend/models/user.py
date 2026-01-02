"""
User model for authentication and authorization.

Represents a system user with credentials and role assignments.
Supports many-to-many relationship with roles through UserRole association.

Attributes:
    id: Primary key
    username: Unique username for login (indexed)
    email: Unique email address (indexed)
    hashed_password: Bcrypt hashed password (never store plain text)
    full_name: User's full name
    is_active: Whether user account is active (can login)
    archived: Soft delete flag (default False)
    created_at: Timestamp when user was created (from TimestampMixin)
    updated_at: Timestamp when user was last updated (from TimestampMixin)
    user_roles: Relationship to Role model through UserRole association
"""

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base
from models.mixins import TimestampMixin


class User(Base, TimestampMixin):
    """
    User model representing authenticated users in the system.

    Inherits created_at and updated_at fields from TimestampMixin.
    Uses soft delete pattern with 'archived' field.

    Password is stored as bcrypt hash. Never store or log plain text passwords.
    Users can have multiple roles through UserRole association table.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    archived = Column(Boolean, default=False, nullable=False, index=True)

    # Timestamps inherited from TimestampMixin:
    # - created_at
    # - updated_at

    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")

    @property
    def roles(self):
        """
        Get list of role names assigned to this user.

        Returns:
            List[str]: Role names (e.g., ['admin', 'sales'])
        """
        return [user_role.role.name for user_role in self.user_roles if not user_role.role.archived]

    def has_role(self, role_name: str) -> bool:
        """
        Check if user has a specific role.

        Args:
            role_name: Name of role to check (e.g., 'admin')

        Returns:
            bool: True if user has the role, False otherwise
        """
        return role_name in self.roles

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', active={self.is_active}, archived={self.archived})>"
