"""medications tables

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "medication_periods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_medication_periods_user_id", "medication_periods", ["user_id"])

    op.create_table(
        "medication_intakes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("period_id", sa.Integer(), sa.ForeignKey("medication_periods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_medication_intakes_period_id", "medication_intakes", ["period_id"])

    op.create_table(
        "medication_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("intake_id", sa.Integer(), sa.ForeignKey("medication_intakes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("pill_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_medication_items_intake_id", "medication_items", ["intake_id"])

    op.create_table(
        "medication_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("intake_id", sa.Integer(), sa.ForeignKey("medication_intakes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("taken", sa.Boolean(), nullable=False, server_default="false"),
        sa.UniqueConstraint("intake_id", "date", name="uq_medication_log_intake_date"),
    )
    op.create_index("ix_medication_logs_intake_id", "medication_logs", ["intake_id"])
    op.create_index("ix_medication_logs_user_id", "medication_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_medication_logs_user_id", table_name="medication_logs")
    op.drop_index("ix_medication_logs_intake_id", table_name="medication_logs")
    op.drop_table("medication_logs")
    op.drop_index("ix_medication_items_intake_id", table_name="medication_items")
    op.drop_table("medication_items")
    op.drop_index("ix_medication_intakes_period_id", table_name="medication_intakes")
    op.drop_table("medication_intakes")
    op.drop_index("ix_medication_periods_user_id", table_name="medication_periods")
    op.drop_table("medication_periods")
