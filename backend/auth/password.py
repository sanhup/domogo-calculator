"""
Password hashing and verification utilities using bcrypt via cryptography.

Provides secure password hashing with bcrypt algorithm.
Never stores or logs plain text passwords.

Functions:
    hash_password: Hash a plain text password using bcrypt
    verify_password: Verify a plain text password against a hashed password
"""

import bcrypt
from logging_config import get_logger

logger = get_logger(__name__)


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        str: Bcrypt hashed password (includes salt)

    Example:
        >>> hashed = hash_password("mySecurePassword123")
        >>> print(hashed)
        $2b$12$KIXVz7L4...
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')

    # Generate salt and hash (default 12 rounds)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)

    logger.debug("Password hashed successfully")

    # Return as string for database storage
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a bcrypt hashed password.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Bcrypt hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("myPassword")
        >>> verify_password("myPassword", hashed)
        True
        >>> verify_password("wrongPassword", hashed)
        False
    """
    # Convert inputs to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')

    # Verify password
    is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)

    logger.debug("Password verification completed", extra={"is_valid": is_valid})

    return is_valid
