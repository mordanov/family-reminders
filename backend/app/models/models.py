from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, ForeignKey,
    Text, Float, Numeric, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class RecurrenceFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="creator", foreign_keys="Task.creator_id")
    activities_created = relationship("Activity", back_populates="creator", foreign_keys="Activity.creator_id")
    life_goals = relationship("LifeGoal", back_populates="owner")


class UserSetting(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    timezone = Column(String(64), default="UTC")

    user = relationship("User", back_populates="settings")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False)
    color = Column(String(16), default="#6366f1")
    emoji = Column(String(8), default="📌")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tasks = relationship("Task", back_populates="category")
    activities = relationship("Activity", back_populates="category")


class RecurringRule(Base):
    __tablename__ = "recurring_rules"
    id = Column(Integer, primary_key=True)
    frequency = Column(SAEnum(RecurrenceFrequency), nullable=False)
    interval = Column(Integer, default=1)
    days_of_week = Column(String(32), nullable=True)  # comma-separated: 0,1,2 (Mon=0)
    end_date = Column(DateTime(timezone=True), nullable=True)

    tasks = relationship("Task", back_populates="recurring_rule")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    remind_at_start = Column(Boolean, default=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    color = Column(String(16), default="#6366f1")
    is_recurring = Column(Boolean, default=False)
    recurring_rule_id = Column(Integer, ForeignKey("recurring_rules.id", ondelete="SET NULL"), nullable=True)
    original_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    is_deleted = Column(Boolean, default=False)

    creator = relationship("User", back_populates="tasks", foreign_keys=[creator_id])
    category = relationship("Category", back_populates="tasks")
    recurring_rule = relationship("RecurringRule", back_populates="tasks")
    original_task = relationship("Task", remote_side="Task.id", foreign_keys=[original_task_id])
    reminder_logs = relationship("ReminderLog", back_populates="task", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    color = Column(String(16), default="#6366f1")
    completed = Column(Boolean, default=False)
    priority = Column(Integer, default=5)

    creator = relationship("User", back_populates="activities_created", foreign_keys=[creator_id])
    category = relationship("Category", back_populates="activities")
    assigned_users = relationship("User", secondary="activity_users", backref="assigned_activities")
    goal_links = relationship("LifeGoalActivity", back_populates="activity")


class ActivityUser(Base):
    __tablename__ = "activity_users"
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)


class LifeGoal(Base):
    __tablename__ = "life_goals"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="life_goals")
    activity_links = relationship("LifeGoalActivity", back_populates="goal", cascade="all, delete-orphan")


class LifeGoalActivity(Base):
    __tablename__ = "life_goal_activities"
    goal_id = Column(Integer, ForeignKey("life_goals.id", ondelete="CASCADE"), primary_key=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True)

    goal = relationship("LifeGoal", back_populates="activity_links")
    activity = relationship("Activity", back_populates="goal_links")


class RegularPayment(Base):
    __tablename__ = "regular_payments"
    id = Column(Integer, primary_key=True)
    paid_at = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=False)
    currency = Column(String(3), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    lessons_count = Column(Integer, nullable=False)
    lessons_per_week = Column(Numeric(4, 1), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MealPlan(Base):
    __tablename__ = "meal_plans"
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    meal_type = Column(String(20), nullable=False)  # 'breakfast'|'lunch'|'dinner'
    adults_text = Column(Text, nullable=False, default='')
    children_text = Column(Text, nullable=False, default='')
    __table_args__ = (UniqueConstraint('date', 'meal_type'),)


class ShoppingListVersion(Base):
    __tablename__ = "shopping_list_versions"
    id = Column(Integer, primary_key=True)
    is_current = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship(
        "ShoppingListItem", back_populates="version",
        cascade="all, delete-orphan",
    )


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"
    id = Column(Integer, primary_key=True)
    version_id = Column(Integer, ForeignKey("shopping_list_versions.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    checked = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    version = relationship("ShoppingListVersion", back_populates="items")


class ReminderLog(Base):
    __tablename__ = "reminders_log"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    method = Column(String(32), default="email")

    task = relationship("Task", back_populates="reminder_logs")


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=False)
    actions_taken = Column(Text, nullable=False)
    importance = Column(Integer, nullable=False, default=3)

    creator = relationship("User", foreign_keys=[creator_id])

