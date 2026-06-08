from fastapi import APIRouter

from .auth import router as auth_router
from .sources import router as sources_router
from .articles import router as articles_router
from .comments import router as comments_router
from .search import router as search_router
from .users import router as users_router
from .admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(sources_router)
api_router.include_router(articles_router)
api_router.include_router(comments_router)
api_router.include_router(search_router)
api_router.include_router(users_router)
api_router.include_router(admin_router)
