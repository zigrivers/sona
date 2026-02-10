"""add_soft_delete

Revision ID: 0974444261ee
Revises: acf2ae49a604
Create Date: 2026-02-10 09:07:45.916352

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0974444261ee"
down_revision: str | None = "acf2ae49a604"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("voice_clones", schema=None) as batch_op:
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("voice_clones", schema=None) as batch_op:
        batch_op.drop_column("deleted_at")
