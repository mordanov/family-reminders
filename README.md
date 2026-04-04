# Reminders — Full-Stack App

A production-ready task, activity, and life goals manager with weekly calendar view.

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy async, asyncpg |
| Database | PostgreSQL 16 |
| Migrations | Alembic (with seed data) |
| Frontend | React 18, Vite, FullCalendar, Zustand, Axios |
| Auth | JWT (python-jose + bcrypt) |
| Infra | Docker, Docker Compose, Nginx |

## Quick Start

```bash
# 1. Clone and enter the directory
cd reminders-app

# 2. Copy env file
cp .env.example .env

# 3. Start everything
docker compose up --build

# App available at:
#   Frontend → http://localhost:3000
#   Backend API → http://localhost:8000
#   API Docs → http://localhost:8000/docs
```

## Default Users

| Username | Password |
|---|---|
| user1 | user1_change_me |
| user2 | user2_change_me |

> ⚠️ Change passwords in production!

## Features

### Tab 1 — Tasks
- **Today's Tasks** — colored time-block cards with start/end times, category emoji, edit/delete
- **Recurring Tasks** — set daily/weekly/monthly/yearly recurrence; edit/delete "this" or "this & future"
- **Activities** — deadline-free tasks with priority (1–10), multi-user assignment, completion toggle
- **Reminders Block** — shows today's tasks with `remind_at_start=true` that haven't started yet; auto-refreshes every 60s

### Tab 2 — Life Goals
- Create goals linked to activities
- Progress auto-calculated from linked activity completion
- Copy goals to another user
- Private per-owner

### Tab 3 — Weekly Schedule
- FullCalendar week/day/month view
- Shows all tasks with color + category emoji
- Recurring task indicators
- Click to create new task

### Settings
- **Timezone** — all times stored in UTC, displayed in user's local timezone
- **Categories** — full CRUD with name, color, emoji

## Architecture

```
backend/
├── app/
│   ├── api/          # FastAPI routers (auth, tasks, activities, categories, goals)
│   ├── services/     # Business logic
│   ├── repositories/ # DB access layer
│   ├── models/       # SQLAlchemy ORM models
│   ├── schemas/      # Pydantic schemas
│   ├── auth/         # JWT security
│   ├── notifications/# Email reminder service
│   └── core/         # Config, database engine
├── alembic/          # Migrations + seed data
└── tests/            # pytest test suite

frontend/
├── src/
│   ├── api/          # Axios client
│   ├── pages/        # Route-level components
│   ├── components/   # Feature components (tasks, activities, goals, forms, ui)
│   ├── store/        # Zustand auth store
│   └── test/         # Vitest + React Testing Library
```

## Running Tests

### Backend
```bash
cd backend
pip install -r requirements.txt
# Uses SQLite in-memory for tests (no Postgres needed)
pytest -v
```

### Frontend
```bash
cd frontend
npm install
npm test
```

## Email Reminders

Set `SMTP_USER` and `SMTP_PASSWORD` in `.env`. Without them, reminders are logged to console.

The background checker runs every `REMINDER_CHECK_INTERVAL` seconds (default: 60) and sends emails for tasks with `remind_at_start=true` that start within the next 15 minutes and haven't been notified yet.

## API Documentation

Interactive Swagger UI available at `http://localhost:8000/docs` when the backend is running.

## Database Schema

- `users` + `user_settings` — auth + timezone preferences
- `categories` — color-coded emoji categories
- `tasks` + `recurring_rules` — scheduled items with optional recurrence
- `activities` + `activity_users` — deadline-free tasks with user assignment
- `life_goals` + `life_goal_activities` — goal tracker linked to activities
- `reminders_log` — email send history to prevent duplicate reminders
