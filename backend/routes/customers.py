from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from pydantic import BaseModel, EmailStr
from database import get_db
from models.customer import Customer
from logging_config import get_logger

# Initialize logger for this module
logger = get_logger(__name__)

router = APIRouter(prefix="/api/customers", tags=["customers"])


# Pydantic schemas
class CustomerBase(BaseModel):
    full_name: str
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    archived: bool
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


# GET /api/customers - List customers with search and filters
@router.get("", response_model=list[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None, description="Search by name, email, phone, or address"),
    archived: Optional[bool] = Query(None, description="Filter by archived status. Default: false (active only)"),
    sort_by: Optional[str] = Query("created_at", description="Sort by field: name, email, created_at"),
    limit: Optional[int] = Query(100, le=1000, description="Maximum number of results"),
    offset: Optional[int] = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """
    Get list of customers with optional search and filters.

    - **search**: Searches in name, email, phone, street address, postal code, and city
    - **archived**: Filter by archived status (true/false). Default: false (active only)
    - **sort_by**: Field to sort by (name, email, created_at)
    - **limit**: Maximum results to return
    - **offset**: Pagination offset
    """
    query = db.query(Customer)

    # Filter by archived status (default: active customers only)
    if archived is None:
        query = query.filter(Customer.archived == False)
    elif archived is not None:
        query = query.filter(Customer.archived == archived)

    # Search across multiple fields
    if search:
        search_filter = or_(
            Customer.full_name.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%"),
            Customer.street_address.ilike(f"%{search}%"),
            Customer.postal_code.ilike(f"%{search}%"),
            Customer.city.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # Sort (with secondary sort by id for stability)
    if sort_by == "name":
        query = query.order_by(Customer.full_name, Customer.id.desc())
    elif sort_by == "email":
        query = query.order_by(Customer.email, Customer.id.desc())
    else:  # Default: created_at
        query = query.order_by(Customer.created_at.desc(), Customer.id.desc())

    # Pagination
    customers = query.offset(offset).limit(limit).all()

    # Convert datetime to ISO string
    return [
        CustomerResponse(
            id=c.id,
            full_name=c.full_name,
            street_address=c.street_address,
            postal_code=c.postal_code,
            city=c.city,
            email=c.email,
            phone=c.phone,
            archived=c.archived,
            created_at=c.created_at.isoformat() if c.created_at else None,
            updated_at=c.updated_at.isoformat() if c.updated_at else None
        )
        for c in customers
    ]


# GET /api/customers/{id} - Get single customer
@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a single customer by ID"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return CustomerResponse(
        id=customer.id,
        full_name=customer.full_name,
        street_address=customer.street_address,
        postal_code=customer.postal_code,
        city=customer.city,
        email=customer.email,
        phone=customer.phone,
        archived=customer.archived,
        created_at=customer.created_at.isoformat() if customer.created_at else None,
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None
    )


# POST /api/customers - Create new customer
@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    logger.info(
        "Creating new customer",
        customer_name=customer.full_name,
        customer_email=customer.email,
        city=customer.city
    )

    new_customer = Customer(
        full_name=customer.full_name,
        street_address=customer.street_address,
        postal_code=customer.postal_code,
        city=customer.city,
        email=customer.email,
        phone=customer.phone,
        archived=False  # New customers are active by default
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    logger.info(
        "Customer created successfully",
        customer_id=new_customer.id,
        customer_name=new_customer.full_name
    )

    return CustomerResponse(
        id=new_customer.id,
        full_name=new_customer.full_name,
        street_address=new_customer.street_address,
        postal_code=new_customer.postal_code,
        city=new_customer.city,
        email=new_customer.email,
        phone=new_customer.phone,
        archived=new_customer.archived,
        created_at=new_customer.created_at.isoformat() if new_customer.created_at else None,
        updated_at=new_customer.updated_at.isoformat() if new_customer.updated_at else None
    )


# PUT /api/customers/{id} - Update customer
@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Update only provided fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return CustomerResponse(
        id=customer.id,
        full_name=customer.full_name,
        street_address=customer.street_address,
        postal_code=customer.postal_code,
        city=customer.city,
        email=customer.email,
        phone=customer.phone,
        archived=customer.archived,
        created_at=customer.created_at.isoformat() if customer.created_at else None,
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None
    )


# POST /api/customers/{id}/archive - Archive customer
@router.post("/{customer_id}/archive", response_model=CustomerResponse)
def archive_customer(customer_id: int, db: Session = Depends(get_db)):
    """Archive a customer (soft delete)"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        logger.warning("Archive attempt on non-existent customer", customer_id=customer_id)
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer.archived:
        logger.warning(
            "Archive attempt on already archived customer",
            customer_id=customer_id,
            customer_name=customer.full_name
        )
        raise HTTPException(status_code=400, detail="Customer is already archived")

    logger.info(
        "Archiving customer",
        customer_id=customer_id,
        customer_name=customer.full_name
    )

    customer.archived = True
    db.commit()
    db.refresh(customer)

    logger.info("Customer archived successfully", customer_id=customer_id)

    return CustomerResponse(
        id=customer.id,
        full_name=customer.full_name,
        street_address=customer.street_address,
        postal_code=customer.postal_code,
        city=customer.city,
        email=customer.email,
        phone=customer.phone,
        archived=customer.archived,
        created_at=customer.created_at.isoformat() if customer.created_at else None,
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None
    )


# POST /api/customers/{id}/unarchive - Unarchive customer
@router.post("/{customer_id}/unarchive", response_model=CustomerResponse)
def unarchive_customer(customer_id: int, db: Session = Depends(get_db)):
    """Unarchive a customer (restore from archived state)"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not customer.archived:
        raise HTTPException(status_code=400, detail="Customer is not archived")

    customer.archived = False
    db.commit()
    db.refresh(customer)

    return CustomerResponse(
        id=customer.id,
        full_name=customer.full_name,
        street_address=customer.street_address,
        postal_code=customer.postal_code,
        city=customer.city,
        email=customer.email,
        phone=customer.phone,
        archived=customer.archived,
        created_at=customer.created_at.isoformat() if customer.created_at else None,
        updated_at=customer.updated_at.isoformat() if customer.updated_at else None
    )
