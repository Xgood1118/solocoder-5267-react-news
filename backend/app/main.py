from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .api import api_router
from .config import get_settings
from .search import init_fts

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        init_fts(db)
    except Exception:
        pass
    finally:
        db.close()

    try:
        from .crawler.scheduler import start_scheduler, stop_scheduler
        start_scheduler()

        yield

        stop_scheduler()
    except ImportError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Crawler module not available: {e}. Starting without scheduled crawls.")
        yield
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to start scheduler: {e}. Starting without scheduled crawls.")
        yield


app = FastAPI(
    title="News Aggregator API",
    description="React + FastAPI 全栈新闻聚合系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "News Aggregator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
