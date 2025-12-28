from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    # Personal information
    full_name = Column(String, nullable=False)
    street_address = Column(String)
    postal_code = Column(String)
    city = Column(String)
    email = Column(String, index=True)
    phone = Column(String)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.full_name}')>"
