from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..database import get_db
from ..models import (
    Article, Source, Subscription, ArticleLike, Favorite,
    ReadLater, ReadHistory, ArticleTag, User
)
from ..schemas import (
    ArticleResponse, ArticleListResponse, LikeActionResponse,
    FavoriteActionResponse, ReadLaterActionResponse, ArticleTagResponse
)
from ..core.security import get_current_user

router = APIRouter(prefix="/articles", tags=["articles"])


def _enrich_article(article: Article, user: User, db: Session) -> dict:
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

    article_dict["tags"] = [
        ArticleTagResponse.model_validate(tag) for tag in article.tags
    ]

    return article_dict


@router.get("", response_model=ArticleListResponse)
def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_id: Optional[int] = None,
    source_ids: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = Query("published_at", regex="^(published_at|created_at|view_count|like_count)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Article)

    if source_id:
        query = query.filter(Article.source_id == source_id)
    elif source_ids:
        try:
            ids = [int(x) for x in source_ids.split(",")]
            query = query.filter(Article.source_id.in_(ids))
        except ValueError:
            pass
    else:
        subscribed_source_ids = db.query(Subscription.source_id).filter(
            Subscription.user_id == current_user.id
        ).subquery()
        query = query.filter(Article.source_id.in_(subscribed_source_ids))

    if tag:
        query = query.join(ArticleTag).filter(ArticleTag.tag == tag)

    total = query.count()

    sort_column = getattr(Article, sort_by, Article.published_at)
    articles = (
        query.order_by(desc(sort_column))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    enriched_articles = [_enrich_article(a, current_user, db) for a in articles]

    return ArticleListResponse(
        items=enriched_articles,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total
    )


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article.view_count += 1
    db.commit()

    background_tasks.add_task(_record_read_history, current_user.id, article_id, db)

    return ArticleResponse(**_enrich_article(article, current_user, db))


def _record_read_history(user_id: int, article_id: int, db: Session):
    try:
        existing = db.query(ReadHistory).filter(
            ReadHistory.user_id == user_id,
            ReadHistory.article_id == article_id
        ).first()

        from datetime import datetime
        if existing:
            existing.read_at = datetime.utcnow()
        else:
            read_history = ReadHistory(
                user_id=user_id,
                article_id=article_id
            )
            db.add(read_history)
        db.commit()
    except Exception:
        db.rollback()


@router.post("/{article_id}/like", response_model=LikeActionResponse)
def toggle_like(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    existing_like = db.query(ArticleLike).filter(
        ArticleLike.user_id == current_user.id,
        ArticleLike.article_id == article_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        article.like_count = max(0, article.like_count - 1)
        liked = False
    else:
        like = ArticleLike(user_id=current_user.id, article_id=article_id)
        db.add(like)
        article.like_count += 1
        liked = True

    db.commit()
    return LikeActionResponse(liked=liked, like_count=article.like_count)


@router.post("/{article_id}/favorite", response_model=FavoriteActionResponse)
def toggle_favorite(
    article_id: int,
    folder: str = "default",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    existing_fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.article_id == article_id
    ).first()

    if existing_fav:
        db.delete(existing_fav)
        favorited = False
    else:
        fav = Favorite(user_id=current_user.id, article_id=article_id, folder=folder)
        db.add(fav)
        favorited = True

    db.commit()
    return FavoriteActionResponse(favorited=favorited)


@router.post("/{article_id}/read-later", response_model=ReadLaterActionResponse)
def toggle_read_later(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    existing = db.query(ReadLater).filter(
        ReadLater.user_id == current_user.id,
        ReadLater.article_id == article_id
    ).first()

    if existing:
        db.delete(existing)
        saved = False
    else:
        rl = ReadLater(user_id=current_user.id, article_id=article_id)
        db.add(rl)
        saved = True

    db.commit()
    return ReadLaterActionResponse(saved=saved)


@router.get("/tags/popular", response_model=List[str])
def get_popular_tags(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags = (
        db.query(ArticleTag.tag, func.count(ArticleTag.id).label("count"))
        .group_by(ArticleTag.tag)
        .order_by(desc("count"))
        .limit(limit)
        .all()
    )
    return [tag for tag, _ in tags]
