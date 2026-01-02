"""
User management API routes for administrators.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.user_role import UserRole
from schemas.user import (
    UserResponse,
    UserListResponse,
    UserUpdate,
    UserPasswordUpdate,
    UserRolesUpdate
)
from auth import (
    hash_password,
    verify_password,
    get_current_active_user,
    require_admin
)
from logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    include_archived: bool = False,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all users (admin only).

    By default, excludes archived users. Set include_archived=true to include them.
    """
    query = db.query(User)

    if not include_archived:
        query = query.filter(User.archived == False)

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    logger.info("Users listed", extra={
        "requested_by": current_user.username,
        "total": total,
        "returned": len(users)
    })

    return {"users": users, "total": total}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.

    Users can view their own profile. Admins can view any user.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        logger.warning("User not found", extra={"user_id": user_id})
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions: user can view themselves, admin can view anyone
    if user_id != current_user.id and not current_user.has_role("admin"):
        logger.warning("Unauthorized user access attempt", extra={
            "attempted_by": current_user.username,
            "target_user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )

    logger.info("User retrieved", extra={
        "user_id": user_id,
        "requested_by": current_user.username
    })

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user information.

    Users can update their own profile. Admins can update any user.
    """
    user = db.query(User).filter(User.id == user_id, User.archived == False).first()

    if not user:
        logger.warning("User not found for update", extra={"user_id": user_id})
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions
    if user_id != current_user.id and not current_user.has_role("admin"):
        logger.warning("Unauthorized user update attempt", extra={
            "attempted_by": current_user.username,
            "target_user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )

    # Only admins can change is_active
    if user_data.is_active is not None and not current_user.has_role("admin"):
        logger.warning("Non-admin attempted to change is_active", extra={
            "attempted_by": current_user.username,
            "target_user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change user active status"
        )

    # Update fields
    if user_data.email is not None:
        # Check email uniqueness
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)

    logger.info("User updated", extra={
        "user_id": user_id,
        "updated_by": current_user.username
    })

    return user


@router.put("/{user_id}/password")
async def update_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user password.

    Users can change their own password by providing current password.
    """
    # Users can only change their own password
    if user_id != current_user.id:
        logger.warning("User attempted to change another user's password", extra={
            "attempted_by": current_user.username,
            "target_user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only change your own password"
        )

    user = db.query(User).filter(User.id == user_id, User.archived == False).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        logger.warning("Password change failed - incorrect current password", extra={
            "user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Hash and set new password
    user.hashed_password = hash_password(password_data.new_password)
    db.commit()

    logger.info("User password updated", extra={
        "user_id": user_id,
        "username": user.username
    })

    return {"message": "Password updated successfully"}


@router.put("/{user_id}/roles", response_model=UserResponse)
async def update_user_roles(
    user_id: int,
    roles_data: UserRolesUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update user's assigned roles (admin only).

    Replaces all current roles with the provided role IDs.
    """
    user = db.query(User).filter(User.id == user_id, User.archived == False).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Remove existing roles
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()

    # Add new roles
    for role_id in roles_data.role_ids:
        user_role = UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)

    db.commit()
    db.refresh(user)

    logger.info("User roles updated", extra={
        "user_id": user_id,
        "new_roles": user.roles,
        "updated_by": current_user.username
    })

    return user


@router.delete("/{user_id}")
async def archive_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Archive (soft delete) a user (admin only).

    Archived users cannot login but their data is preserved.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already archived"
        )

    # Prevent archiving yourself
    if user_id == current_user.id:
        logger.warning("User attempted to archive themselves", extra={
            "user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot archive your own account"
        )

    user.archived = True
    user.is_active = False
    db.commit()

    logger.info("User archived", extra={
        "user_id": user_id,
        "username": user.username,
        "archived_by": current_user.username
    })

    return {"message": f"User {user.username} archived successfully"}
