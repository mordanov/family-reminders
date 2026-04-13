"""incidents table

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("creator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("actions_taken", sa.Text(), nullable=False),
        sa.Column("importance", sa.Integer(), nullable=False, server_default="3"),
    )
    op.create_index("ix_incidents_creator_id", "incidents", ["creator_id"])


def downgrade() -> None:
    op.drop_index("ix_incidents_creator_id", table_name="incidents")
    op.drop_table("incidents")

