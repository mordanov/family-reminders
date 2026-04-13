from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.tasks import router as tasks_router
from app.api.activities import router as activities_router
from app.api.goals import router as goals_router
from app.api.nutrition import router as nutrition_router
from app.api.payments import router as payments_router
from app.api.incidents import router as incidents_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(tasks_router)
api_router.include_router(activities_router)
api_router.include_router(goals_router)
api_router.include_router(nutrition_router, prefix="/nutrition", tags=["nutrition"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(incidents_router)
