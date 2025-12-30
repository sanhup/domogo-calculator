"""
Model Mixins

Reusable mixins for SQLAlchemy models to avoid code duplication.
"""

from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at timestamp fields to a model.

    Usage:
        class MyModel(Base, TimestampMixin):
            __tablename__ = "my_table"
            id = Column(Integer, primary_key=True)
            # ... other fields

    Fields added:
        - created_at: Automatically set to current timestamp on insert
        - updated_at: Automatically updated to current timestamp on update
    """

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when the record was created"
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Timestamp when the record was last updated"
    )
