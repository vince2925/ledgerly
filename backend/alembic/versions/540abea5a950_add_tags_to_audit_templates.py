"""add_tags_to_audit_templates

Revision ID: 540abea5a950
Revises: ddba6afe9d11
Create Date: 2025-10-05 15:25:43.783585

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '540abea5a950'
down_revision: Union[str, Sequence[str], None] = 'ddba6afe9d11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('audit_templates', sa.Column('tags', sa.ARRAY(sa.String()), server_default='{}', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('audit_templates', 'tags')
