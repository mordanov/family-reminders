"""nutrition tables

Revision ID: 0003
Revises: 0002
Create Date: 2024-01-03 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meal_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(20), nullable=False),
        sa.Column("adults_text", sa.Text(), nullable=False, server_default="''"),
        sa.Column("children_text", sa.Text(), nullable=False, server_default="''"),
        sa.UniqueConstraint("date", "meal_type", name="uq_meal_plans_date_meal_type"),
    )

    op.create_table(
        "shopping_list_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "shopping_list_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("version_id", sa.Integer(), sa.ForeignKey("shopping_list_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_shopping_list_items_version_id", "shopping_list_items", ["version_id"])


def downgrade() -> None:
    op.drop_index("ix_shopping_list_items_version_id", "shopping_list_items")
    op.drop_table("shopping_list_items")
    op.drop_table("shopping_list_versions")
    op.drop_table("meal_plans")
