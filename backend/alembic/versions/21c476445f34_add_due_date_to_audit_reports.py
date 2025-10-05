"""add_due_date_to_audit_reports

Revision ID: 21c476445f34
Revises: fa8215fe189b
Create Date: 2025-10-05 15:37:09.557882

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21c476445f34'
down_revision: Union[str, Sequence[str], None] = 'fa8215fe189b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('audit_reports', sa.Column('due_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('audit_reports', 'due_date')
