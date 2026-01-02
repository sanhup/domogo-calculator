"""
JWT token generation and validation utilities.

Provides functions to create and verify JWT access and refresh tokens.
Tokens are signed using HS256 algorithm with a secret key from environment.

Functions:
    create_access_token: Generate a short-lived JWT access token
    create_refresh_token: Generate a long-lived JWT refresh token
    decode_token: Decode and validate a JWT token
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from logging_config import get_logger

logger = get_logger(__name__)

# JWT Configuration from environment variables
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
JWT_REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with user data.

    Args:
        data: Dictionary containing user information (typically user_id, username, roles)
        expires_delta: Optional custom expiration time (default: 30 minutes)

    Returns:
        str: Encoded JWT token

    Example:
        >>> token = create_access_token({"sub": "user123", "roles": ["admin"]})
        >>> print(token)
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    logger.info("Access token created", extra={
        "user_id": data.get("sub"),
        "expires_at": expire.isoformat()
    })

    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token for obtaining new access tokens.

    Refresh tokens are long-lived and used to get new access tokens
    without requiring the user to login again.

    Args:
        data: Dictionary containing user information (typically user_id)

    Returns:
        str: Encoded JWT refresh token

    Example:
        >>> token = create_refresh_token({"sub": "user123"})
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    logger.info("Refresh token created", extra={
        "user_id": data.get("sub"),
        "expires_at": expire.isoformat()
    })

    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string to decode
        token_type: Expected token type ('access' or 'refresh')

    Returns:
        Dict containing token payload if valid, None if invalid

    Example:
        >>> payload = decode_token(token)
        >>> if payload:
        ...     user_id = payload.get("sub")
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Verify token type matches expected type
        if payload.get("type") != token_type:
            logger.warning("Token type mismatch", extra={
                "expected": token_type,
                "actual": payload.get("type")
            })
            return None

        logger.debug("Token decoded successfully", extra={
            "user_id": payload.get("sub"),
            "token_type": token_type
        })

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired", extra={"token_type": token_type})
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid token", extra={
            "error": str(e),
            "token_type": token_type
        })
        return None
