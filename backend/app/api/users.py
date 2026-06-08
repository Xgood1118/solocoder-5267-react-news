from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import (
    User, Favorite, ReadLater, ReadHistory,
    Article, Source, Subscription, Notification
)
from ..schemas import (
    ArticleResponse, ArticleListResponse, ReadHistoryResponse,
    SubscriptionResponse, NotificationListResponse, NotificationResponse,
    SourceResponse
)
from ..core.security import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


def _enrich_article_simple(article: Article, user: User, db: Session) -> dict:
    from ..models import ArticleLike, Favorite, ReadLater, ArticleTag

    article_dict = ArticleResponse.model_validate(article).model_dump()

    article_dict["is_liked"] = db.query(ArticleLike).filter(
        ArticleLike.user_id == user.id,
        ArticleLike.article_id == article.id
    ).first() is not None

    article_dict["is_favorited"] = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.article_id == article.id
    ).first() is not None

    article_dict["is_read_later"] = db.query(ReadLater).filter(
        ReadLater.user_id == user.id,
        ReadLater.article_id == article.id
    ).first() is not None

    return article_dict


@router.get("/favorites", response_model=ArticleListResponse)
def get_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    folder: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Favorite).filter(Favorite.user_id == current_user.id)
    if folder:
        query = query.filter(Favorite.folder == folder)

    total = query.count()

    favorites = (
        query.order_by(desc(Favorite.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    articles = [
        _enrich_article_simple(fav.article, current_user, db)
        for fav in favorites
        if fav.article
    ]

    return ArticleListResponse(
        items=articles,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total
    )


@router.get("/read-later", response_model=ArticleListResponse)
def get_read_later(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReadLater).filter(ReadLater.user_id == current_user.id)
    total = query.count()

    read_later_items = (
        query.order_by(desc(ReadLater.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    articles = [
        _enrich_article_simple(item.article, current_user, db)
        for item in read_later_items
        if item.article
    ]

    return ArticleListResponse(
        items=articles,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total
    )


@router.get("/read-history", response_model=ArticleListResponse)
def get_read_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReadHistory).filter(ReadHistory.user_id == current_user.id)
    total = query.count()

    history_items = (
        query.order_by(desc(ReadHistory.read_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    articles = [
        _enrich_article_simple(item.article, current_user, db)
        for item in history_items
        if item.article
    ]

    return ArticleListResponse(
        items=articles,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total
    )


@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_my_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .all()
    )
    return subscriptions


@router.get("/notifications", response_model=NotificationListResponse)
def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    notifications = (
        query.order_by(desc(Notification.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return NotificationListResponse(
        items=notifications,
        total=total,
        unread_count=unread_count
    )


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"success": True}


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return {"success": True}


@router.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import func

    subscription_count = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).count()

    favorite_count = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).count()

    read_later_count = db.query(ReadLater).filter(
        ReadLater.user_id == current_user.id
    ).count()

    read_count = db.query(ReadHistory).filter(
        ReadHistory.user_id == current_user.id
    ).count()

    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {
        "subscription_count": subscription_count,
        "favorite_count": favorite_count,
        "read_later_count": read_later_count,
        "read_count": read_count,
        "unread_notifications": unread_notifications
    }
