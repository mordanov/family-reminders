"""seed default users and categories

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-01 00:01:00.000000

"""
import os
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")


def upgrade() -> None:
    conn = op.get_bind()

    # Insert default users from environment variables
    user1_username = os.environ.get("DEFAULT_USER1_USERNAME", "user1")
    user1_email = os.environ.get("DEFAULT_USER1_EMAIL", "user1@example.com")
    user1_password = os.environ.get("DEFAULT_USER1_PASSWORD", "user1_change_me")
    user2_username = os.environ.get("DEFAULT_USER2_USERNAME", "user2")
    user2_email = os.environ.get("DEFAULT_USER2_EMAIL", "user2@example.com")
    user2_password = os.environ.get("DEFAULT_USER2_PASSWORD", "user2_change_me")

    users_table = sa.table(
        "users",
        sa.column("username", sa.String),
        sa.column("email", sa.String),
        sa.column("hashed_password", sa.String),
        sa.column("is_active", sa.Boolean),
    )
    result = conn.execute(
        users_table.insert().returning(sa.literal_column("id")).values([
            {
                "username": user1_username,
                "email": user1_email,
                "hashed_password": pwd_context.hash(user1_password),
                "is_active": True,
            },
            {
                "username": user2_username,
                "email": user2_email,
                "hashed_password": pwd_context.hash(user2_password),
                "is_active": True,
            },
        ])
    )
    user_ids = [row[0] for row in result.fetchall()]

    # Insert user settings
    settings_table = sa.table(
        "user_settings",
        sa.column("user_id", sa.Integer),
        sa.column("timezone", sa.String),
    )
    conn.execute(settings_table.insert().values([
        {"user_id": uid, "timezone": "UTC"} for uid in user_ids
    ]))

    # Insert default categories
    categories_table = sa.table(
        "categories",
        sa.column("name", sa.String),
        sa.column("color", sa.String),
        sa.column("emoji", sa.String),
    )
    conn.execute(categories_table.insert().values([
        {"name": "Vera", "color": "#f43f5e", "emoji": "👩"},
        {"name": "Taisia", "color": "#8b5cf6", "emoji": "👧"},
        {"name": "Travel", "color": "#0ea5e9", "emoji": "✈️"},
        {"name": "Work", "color": "#f59e0b", "emoji": "💼"},
        {"name": "Health", "color": "#10b981", "emoji": "💪"},
    ]))


def downgrade() -> None:
    conn = op.get_bind()
    user1_username = os.environ.get("DEFAULT_USER1_USERNAME", "user1")
    user2_username = os.environ.get("DEFAULT_USER2_USERNAME", "user2")
    conn.execute(sa.text(f"DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE username IN ('{user1_username}','{user2_username}'))"))
    conn.execute(sa.text(f"DELETE FROM users WHERE username IN ('{user1_username}', '{user2_username}')"))
    conn.execute(sa.text("DELETE FROM categories WHERE name IN ('Vera','Taisia','Travel','Work','Health')"))
