"""initial schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(64), unique=True, nullable=False),
        sa.Column("email", sa.String(128), unique=True, nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_username", "users", ["username"])

    op.create_table(
        "user_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("timezone", sa.String(64), default="UTC"),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("color", sa.String(16), default="#6366f1"),
        sa.Column("emoji", sa.String(8), default="📌"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "recurring_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("frequency", sa.String(16), nullable=False),
        sa.Column("interval", sa.Integer(), default=1),
        sa.Column("days_of_week", sa.String(32), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("remind_at_start", sa.Boolean(), default=False),
        sa.Column("creator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("color", sa.String(16), default="#6366f1"),
        sa.Column("is_recurring", sa.Boolean(), default=False),
        sa.Column("recurring_rule_id", sa.Integer(), sa.ForeignKey("recurring_rules.id", ondelete="SET NULL"), nullable=True),
        sa.Column("original_task_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), default=False),
    )

    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("creator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("color", sa.String(16), default="#6366f1"),
        sa.Column("completed", sa.Boolean(), default=False),
        sa.Column("priority", sa.Integer(), default=5),
    )

    op.create_table(
        "activity_users",
        sa.Column("activity_id", sa.Integer(), sa.ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "life_goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "life_goal_activities",
        sa.Column("goal_id", sa.Integer(), sa.ForeignKey("life_goals.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("activity_id", sa.Integer(), sa.ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "reminders_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("method", sa.String(32), default="email"),
    )


def downgrade() -> None:
    op.drop_table("reminders_log")
    op.drop_table("life_goal_activities")
    op.drop_table("life_goals")
    op.drop_table("activity_users")
    op.drop_table("activities")
    op.drop_table("tasks")
    op.drop_table("recurring_rules")
    op.drop_table("categories")
    op.drop_table("user_settings")
    op.drop_index("ix_users_username", "users")
    op.drop_table("users")
