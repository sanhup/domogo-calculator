"""
Seed initial admin user for the application.

Creates a default admin user with credentials:
- Username: admin
- Password: admin123 (CHANGE THIS IN PRODUCTION!)
- Email: admin@domogo.nl

IMPORTANT: Change the admin password immediately after first login in production!
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
from models.user import User
from models.role import Role
from models.user_role import UserRole
from auth import hash_password
from logging_config import get_logger

logger = get_logger(__name__)


def seed_users():
    """Seed initial admin user into the database."""
    db = SessionLocal()

    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()

        if existing_admin:
            logger.info("Admin user already exists", extra={
                "username": "admin"
            })
            return

        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()

        if not admin_role:
            logger.error("Admin role not found - run seed_roles first")
            raise Exception("Admin role not found. Please run seed_roles.py first.")

        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@domogo.nl",
            hashed_password=hash_password("admin123"),
            full_name="Administrator",
            is_active=True,
            archived=False
        )

        db.add(admin_user)
        db.flush()  # Get user ID

        # Assign admin role
        user_role = UserRole(user_id=admin_user.id, role_id=admin_role.id)
        db.add(user_role)

        db.commit()

        logger.info("Admin user created successfully", extra={
            "user_id": admin_user.id,
            "username": admin_user.username,
            "email": admin_user.email
        })

        print("\n" + "=" * 60)
        print("ADMIN USER CREATED SUCCESSFULLY")
        print("=" * 60)
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Email: admin@domogo.nl")
        print("\nIMPORTANT: Change this password immediately in production!")
        print("=" * 60 + "\n")

    except Exception as e:
        db.rollback()
        logger.error("User seeding failed", extra={"error": str(e)})
        raise

    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting user seeding...")
    seed_users()
    logger.info("User seeding finished")
