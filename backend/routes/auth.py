"""
Authentication API routes for login, register, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.role import Role
from models.user_role import UserRole
from schemas.auth import UserRegister, UserLogin, Token, TokenRefresh, UserResponse
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_active_user,
)
from logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user account.

    Creates a new user with hashed password and assigns default 'user' role.
    Usernames and emails must be unique.
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        logger.warning("Registration failed - username exists", extra={
            "username": user_data.username
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        logger.warning("Registration failed - email exists", extra={
            "email": user_data.email
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        archived=False
    )

    db.add(new_user)
    db.flush()  # Get user ID without committing

    # Assign default 'user' role
    default_role = db.query(Role).filter(Role.name == "user", Role.archived == False).first()
    if default_role:
        user_role = UserRole(user_id=new_user.id, role_id=default_role.id)
        db.add(user_role)

    db.commit()
    db.refresh(new_user)

    logger.info("User registered successfully", extra={
        "user_id": new_user.id,
        "username": new_user.username,
        "email": new_user.email
    })

    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT tokens.

    Returns access token (30 min) and refresh token (7 days).
    """
    # Find user by username
    user = db.query(User).filter(
        User.username == credentials.username,
        User.archived == False
    ).first()

    if not user:
        logger.warning("Login failed - user not found", extra={
            "username": credentials.username
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        logger.warning("Login failed - invalid password", extra={
            "user_id": user.id,
            "username": user.username
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Check if user is active
    if not user.is_active:
        logger.warning("Login failed - inactive user", extra={
            "user_id": user.id,
            "username": user.username
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create tokens
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "roles": user.roles
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": str(user.id)})

    logger.info("User logged in successfully", extra={
        "user_id": user.id,
        "username": user.username
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.

    Returns new access token and refresh token.
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token, token_type="refresh")

    if not payload:
        logger.warning("Token refresh failed - invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    if not user_id:
        logger.warning("Token refresh failed - missing user ID")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Get user from database
    user = db.query(User).filter(
        User.id == int(user_id),
        User.archived == False,
        User.is_active == True
    ).first()

    if not user:
        logger.warning("Token refresh failed - user not found", extra={
            "user_id": user_id
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "roles": user.roles
    }

    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    logger.info("Token refreshed successfully", extra={
        "user_id": user.id,
        "username": user.username
    })

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout current user.

    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the tokens. This endpoint is provided for logging purposes.
    """
    logger.info("User logged out", extra={
        "user_id": current_user.id,
        "username": current_user.username
    })

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    """
    return current_user
