from sqlalchemy import Column, Integer, String, Boolean
from database import Base
from models.mixins import TimestampMixin


class Customer(Base, TimestampMixin):
    """
    Customer model representing a lead or customer in the system.

    Inherits created_at and updated_at fields from TimestampMixin.
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    # Personal information
    full_name = Column(String, nullable=False)
    street_address = Column(String)
    postal_code = Column(String)
    city = Column(String)
    email = Column(String, index=True)
    phone = Column(String)

    # Status
    archived = Column(Boolean, default=False, nullable=False, index=True)

    # Timestamps inherited from TimestampMixin:
    # - created_at
    # - updated_at

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.full_name}', archived={self.archived})>"
