"""add_status_to_audit_templates

Revision ID: fa8215fe189b
Revises: 540abea5a950
Create Date: 2025-10-05 15:28:02.539335

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa8215fe189b'
down_revision: Union[str, Sequence[str], None] = '540abea5a950'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum type
    op.execute("CREATE TYPE templatestatus AS ENUM ('draft', 'active', 'archived')")

    # Add status column with default value
    op.add_column('audit_templates', sa.Column('status', sa.Enum('draft', 'active', 'archived', name='templatestatus'), nullable=False, server_default='draft'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('audit_templates', 'status')
    op.execute("DROP TYPE templatestatus")
