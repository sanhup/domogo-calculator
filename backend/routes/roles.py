"""
Role management API routes for administrators.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.role import Role
from models.user_role import UserRole
from schemas.role import RoleCreate, RoleUpdate, RoleResponse, RoleListResponse
from auth import require_admin
from logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/roles", tags=["Roles"])


@router.get("/", response_model=RoleListResponse)
async def list_roles(
    include_archived: bool = False,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all roles (admin only).

    By default, excludes archived roles. Set include_archived=true to include them.
    """
    query = db.query(Role)

    if not include_archived:
        query = query.filter(Role.archived == False)

    roles = query.all()

    logger.info("Roles listed", extra={
        "requested_by": current_user.username,
        "total": len(roles)
    })

    return {"roles": roles, "total": len(roles)}


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get role by ID (admin only).
    """
    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        logger.warning("Role not found", extra={
            "role_id": role_id,
            "requested_by": current_user.username
        })
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    logger.info("Role retrieved", extra={
        "role_id": role_id,
        "role_name": role.name,
        "requested_by": current_user.username
    })

    return role


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new role (admin only).

    Role names must be unique.
    """
    # Check if role name already exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        logger.warning("Role creation failed - name exists", extra={
            "role_name": role_data.name,
            "attempted_by": current_user.username
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )

    # Create new role
    new_role = Role(
        name=role_data.name,
        description=role_data.description,
        archived=False
    )

    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    logger.info("Role created", extra={
        "role_id": new_role.id,
        "role_name": new_role.name,
        "created_by": current_user.username
    })

    return new_role


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update role information (admin only).
    """
    role = db.query(Role).filter(Role.id == role_id, Role.archived == False).first()

    if not role:
        logger.warning("Role not found for update", extra={
            "role_id": role_id,
            "attempted_by": current_user.username
        })
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Update fields
    if role_data.name is not None:
        # Check name uniqueness
        existing = db.query(Role).filter(
            Role.name == role_data.name,
            Role.id != role_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
        role.name = role_data.name

    if role_data.description is not None:
        role.description = role_data.description

    db.commit()
    db.refresh(role)

    logger.info("Role updated", extra={
        "role_id": role_id,
        "role_name": role.name,
        "updated_by": current_user.username
    })

    return role


@router.delete("/{role_id}")
async def archive_role(
    role_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Archive (soft delete) a role (admin only).

    Archived roles cannot be assigned to users but existing assignments are preserved.
    """
    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    if role.archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is already archived"
        )

    # Check how many users have this role
    user_count = db.query(UserRole).filter(UserRole.role_id == role_id).count()

    role.archived = True
    db.commit()

    logger.info("Role archived", extra={
        "role_id": role_id,
        "role_name": role.name,
        "affected_users": user_count,
        "archived_by": current_user.username
    })

    return {
        "message": f"Role {role.name} archived successfully",
        "affected_users": user_count
    }
