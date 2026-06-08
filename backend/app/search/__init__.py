from typing import List, Tuple, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
import jieba

from ..schemas import SearchResultArticle


def _tokenize_chinese(text: str) -> str:
    words = jieba.cut_for_search(text)
    return " ".join(words)


def init_fts(db: Session):
    db.execute(text("""
        CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5(
            title,
            summary,
            content,
            author,
            content='articles',
            content_rowid='id',
            tokenize='unicode61'
        )
    """))
    db.commit()


def index_article(db: Session, article_id: int, title: str, summary: str,
                  content: str, author: str):
    db.execute(text("""
        INSERT OR REPLACE INTO article_fts(rowid, title, summary, content, author)
        VALUES (:id, :title, :summary, :content, :author)
    """), {
        "id": article_id,
        "title": _tokenize_chinese(title),
        "summary": _tokenize_chinese(summary or ""),
        "content": _tokenize_chinese(content or ""),
        "author": author or ""
    })
    db.commit()


def delete_article_index(db: Session, article_id: int):
    db.execute(text("DELETE FROM article_fts WHERE rowid = :id"), {"id": article_id})
    db.commit()


def search_articles(
    db: Session,
    query: str,
    page: int = 1,
    page_size: int = 20,
    source_id: Optional[int] = None,
    sort_by: str = "relevance"
) -> Tuple[List[SearchResultArticle], int]:
    tokens = _tokenize_chinese(query)
    search_query = tokens.strip()

    if not search_query:
        return [], 0

    params = {"query": f'"{search_query}"*', "offset": (page - 1) * page_size, "limit": page_size}

    if source_id:
        count_sql = """
            SELECT COUNT(DISTINCT a.id)
            FROM article_fts fts
            JOIN articles a ON fts.rowid = a.id
            WHERE article_fts MATCH :query
            AND a.source_id = :source_id
        """
        params["source_id"] = source_id
    else:
        count_sql = """
            SELECT COUNT(*)
            FROM article_fts
            WHERE article_fts MATCH :query
        """

    total_result = db.execute(text(count_sql), params).fetchone()
    total = total_result[0] if total_result else 0

    if sort_by == "published_at":
        order_by = "a.published_at DESC"
    else:
        order_by = "rank ASC"

    if source_id:
        sql = f"""
            SELECT
                a.id,
                a.title,
                a.url,
                a.summary,
                a.author,
                a.published_at,
                a.source_id,
                s.name as source_name,
                snippet(article_fts, 0, '<mark>', '</mark>', '...', 30) as title_highlight,
                snippet(article_fts, 1, '<mark>', '</mark>', '...', 60) as summary_highlight
            FROM article_fts fts
            JOIN articles a ON fts.rowid = a.id
            JOIN sources s ON a.source_id = s.id
            WHERE article_fts MATCH :query
            AND a.source_id = :source_id
            ORDER BY {order_by}
            LIMIT :limit OFFSET :offset
        """
    else:
        sql = f"""
            SELECT
                a.id,
                a.title,
                a.url,
                a.summary,
                a.author,
                a.published_at,
                a.source_id,
                s.name as source_name,
                snippet(article_fts, 0, '<mark>', '</mark>', '...', 30) as title_highlight,
                snippet(article_fts, 1, '<mark>', '</mark>', '...', 60) as summary_highlight
            FROM article_fts fts
            JOIN articles a ON fts.rowid = a.id
            JOIN sources s ON a.source_id = s.id
            WHERE article_fts MATCH :query
            ORDER BY {order_by}
            LIMIT :limit OFFSET :offset
        """

    rows = db.execute(text(sql), params).fetchall()

    results = []
    for row in rows:
        highlight = row.summary_highlight if row.summary_highlight else row.title_highlight
        results.append(SearchResultArticle(
            id=row.id,
            title=row.title,
            url=row.url,
            summary=row.summary,
            author=row.author,
            published_at=row.published_at,
            source_id=row.source_id,
            source_name=row.source_name,
            highlight=highlight,
            score=0.0
        ))

    return results, total


def rebuild_index(db: Session):
    from ..models import Article

    db.execute(text("DELETE FROM article_fts"))
    db.commit()

    articles = db.query(Article).all()
    for article in articles:
        index_article(
            db,
            article_id=article.id,
            title=article.title,
            summary=article.summary,
            content=article.content,
            author=article.author
        )

    return len(articles)
