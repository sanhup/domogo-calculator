"""
UserRole association model for many-to-many relationship between users and roles.

Represents the assignment of roles to users. A user can have multiple roles,
and a role can be assigned to multiple users.

Attributes:
    user_id: Foreign key to users table
    role_id: Foreign key to roles table
    created_at: Timestamp when role was assigned to user
"""

from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class UserRole(Base):
    """
    Association table for many-to-many relationship between User and Role.

    Tracks when each role was assigned to a user via created_at timestamp.
    Composite primary key on (user_id, role_id).
    """

    __tablename__ = "user_roles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")

    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"
