"""add archived field to customers

Revision ID: 3f8d9a1c2b4e
Revises: 5ce714c8ed57
Create Date: 2025-12-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f8d9a1c2b4e'
down_revision: Union[str, None] = '5ce714c8ed57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add archived column to customers table
    op.add_column('customers', sa.Column('archived', sa.Boolean(), nullable=False, server_default='false'))

    # Create index on archived field for faster queries
    op.create_index(op.f('ix_customers_archived'), 'customers', ['archived'], unique=False)


def downgrade() -> None:
    # Drop index first
    op.drop_index(op.f('ix_customers_archived'), table_name='customers')

    # Drop archived column
    op.drop_column('customers', 'archived')
