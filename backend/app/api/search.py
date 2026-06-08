from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Article, Source, ArticleTag, User
from ..schemas import SearchResponse, SearchResultArticle
from ..core.security import get_current_user
from ..search import search_articles

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_id: Optional[int] = None,
    sort_by: str = Query("relevance", regex="^(relevance|published_at)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results, total = search_articles(
        db,
        query=q,
        page=page,
        page_size=page_size,
        source_id=source_id,
        sort_by=sort_by
    )

    return SearchResponse(
        items=results,
        total=total,
        page=page,
        page_size=page_size,
        query=q
    )


@router.get("/suggest")
def search_suggest(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import or_

    suggestions = []

    article_suggestions = (
        db.query(Article.id, Article.title)
        .filter(Article.title.contains(q))
        .limit(limit)
        .all()
    )
    for aid, title in article_suggestions:
        suggestions.append({"type": "article", "id": aid, "title": title})

    source_suggestions = (
        db.query(Source.id, Source.name)
        .filter(Source.name.contains(q))
        .limit(limit)
        .all()
    )
    for sid, name in source_suggestions:
        suggestions.append({"type": "source", "id": sid, "title": name})

    tag_suggestions = (
        db.query(ArticleTag.tag)
        .filter(ArticleTag.tag.contains(q))
        .distinct()
        .limit(limit)
        .all()
    )
    for (tag,) in tag_suggestions:
        suggestions.append({"type": "tag", "title": tag})

    return {"items": suggestions[:limit]}
