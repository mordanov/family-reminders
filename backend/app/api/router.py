from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.tasks import router as tasks_router
from app.api.activities import router as activities_router
from app.api.goals import router as goals_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(tasks_router)
api_router.include_router(activities_router)
api_router.include_router(goals_router)
