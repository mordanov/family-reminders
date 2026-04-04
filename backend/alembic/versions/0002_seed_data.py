"""seed default users and categories

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-01 00:01:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    conn = op.get_bind()

    # Insert default users
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
                "username": "user1",
                "email": "user1@example.com",
                "hashed_password": pwd_context.hash("user1_change_me"),
                "is_active": True,
            },
            {
                "username": "user2",
                "email": "user2@example.com",
                "hashed_password": pwd_context.hash("user2_change_me"),
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
    conn.execute(sa.text("DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE username IN ('user1','user2'))"))
    conn.execute(sa.text("DELETE FROM users WHERE username IN ('user1', 'user2')"))
    conn.execute(sa.text("DELETE FROM categories WHERE name IN ('Vera','Taisia','Travel','Work','Health')"))
