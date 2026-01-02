"""
Seed default roles for the application.

Creates the following roles:
- admin: Full system access
- sales: Access to customers, calculations, offers
- user: Basic access (future use)
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import SessionLocal
from models.role import Role
from logging_config import get_logger

logger = get_logger(__name__)


def seed_roles():
    """Seed default roles into the database."""
    db = SessionLocal()

    try:
        # Define default roles
        default_roles = [
            {
                "name": "admin",
                "description": "Administrator with full system access"
            },
            {
                "name": "sales",
                "description": "Sales representative with access to customers and calculations"
            },
            {
                "name": "user",
                "description": "Basic user role for future use"
            }
        ]

        for role_data in default_roles:
            # Check if role already exists
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()

            if existing_role:
                logger.info("Role already exists", extra={
                    "role_name": role_data["name"]
                })
                continue

            # Create new role
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                archived=False
            )

            db.add(role)
            logger.info("Role created", extra={
                "role_name": role_data["name"]
            })

        db.commit()
        logger.info("Role seeding completed successfully")

    except Exception as e:
        db.rollback()
        logger.error("Role seeding failed", extra={"error": str(e)})
        raise

    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting role seeding...")
    seed_roles()
    logger.info("Role seeding finished")
