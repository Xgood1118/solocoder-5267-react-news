from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..database import get_db
from ..models import Source, CrawlLog, User, Article
from ..schemas import SourceResponse, CrawlLogResponse, UserResponse
from ..core.security import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/sources", response_model=List[SourceResponse])
def admin_list_sources(
    skip: int = 0,
    limit: int = 50,
    is_enabled: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    query = db.query(Source)
    if is_enabled is not None:
        query = query.filter(Source.is_enabled == is_enabled)

    sources = query.order_by(Source.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for source in sources:
        source_dict = SourceResponse.model_validate(source).model_dump()
        source_dict["subscriber_count"] = db.query(Source.subscribers).filter(
            Source.id == source.id
        ).count()
        result.append(SourceResponse(**source_dict))

    return result


@router.get("/sources/{source_id}/logs", response_model=List[CrawlLogResponse])
def get_source_crawl_logs(
    source_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    logs = (
        db.query(CrawlLog)
        .filter(CrawlLog.source_id == source_id)
        .order_by(desc(CrawlLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs


@router.post("/sources/{source_id}/crawl")
def admin_crawl_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from ..crawler.scheduler import crawl_source

    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    result = crawl_source(source_id)
    return result


@router.post("/sources/crawl-all")
def admin_crawl_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    from ..crawler.scheduler import crawl_all_sources
    from threading import Thread

    thread = Thread(target=crawl_all_sources)
    thread.start()
    return {"message": "Crawl started in background"}


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    total_users = db.query(User).count()
    total_sources = db.query(Source).count()
    total_articles = db.query(Article).count()

    active_sources = db.query(Source).filter(Source.is_enabled == True).count()

    failed_sources = db.query(Source).filter(Source.failure_count > 0).count()

    from datetime import datetime, timedelta
    one_day_ago = datetime.utcnow() - timedelta(days=1)

    articles_today = db.query(Article).filter(
        Article.created_at >= one_day_ago
    ).count()

    crawls_today = db.query(CrawlLog).filter(
        CrawlLog.created_at >= one_day_ago
    ).count()

    failed_crawls_today = db.query(CrawlLog).filter(
        CrawlLog.created_at >= one_day_ago,
        CrawlLog.status == "failed"
    ).count()

    success_rate = (
        round((crawls_today - failed_crawls_today) / crawls_today * 100, 2)
        if crawls_today > 0 else 0
    )

    return {
        "total_users": total_users,
        "total_sources": total_sources,
        "active_sources": active_sources,
        "failed_sources": failed_sources,
        "total_articles": total_articles,
        "articles_today": articles_today,
        "crawls_today": crawls_today,
        "failed_crawls_today": failed_crawls_today,
        "success_rate": success_rate
    }


@router.get("/users", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return users
