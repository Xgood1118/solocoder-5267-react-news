from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from ..database import get_db
from ..models import Article, Comment, CommentLike, User
from ..schemas import CommentCreate, CommentResponse, CommentListResponse
from ..core.security import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])

MAX_LEVEL = 3


def _build_comment_tree(comments: List[Comment]) -> List[CommentResponse]:
    comment_dict = {}
    root_comments = []

    for comment in comments:
        comment_dict[comment.id] = CommentResponse(
            id=comment.id,
            article_id=comment.article_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            path=comment.path,
            level=comment.level,
            content=comment.content if not comment.is_deleted else "[已删除]",
            like_count=comment.like_count,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            user=comment.user,
            replies=[]
        )

    for comment in comments:
        if comment.parent_id is None:
            root_comments.append(comment_dict[comment.id])
        else:
            parent = comment_dict.get(comment.parent_id)
            if parent:
                parent.replies.append(comment_dict[comment.id])

    return root_comments


@router.get("/article/{article_id}", response_model=CommentListResponse)
def get_article_comments(
    article_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    root_comments_query = db.query(Comment).filter(
        and_(
            Comment.article_id == article_id,
            Comment.parent_id.is_(None)
        )
    )

    total = root_comments_query.count()

    root_comments = (
        root_comments_query
        .order_by(desc(Comment.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    root_ids = [c.id for c in root_comments]

    all_comments = list(root_comments)

    if root_ids:
        path_prefixes = [f"{cid}." for cid in root_ids]
        from sqlalchemy import or_
        conditions = [Comment.path.like(f"{path}%") for path in path_prefixes]
        child_comments = (
            db.query(Comment)
            .filter(and_(Comment.article_id == article_id, or_(*conditions)))
            .order_by(Comment.created_at.asc())
            .all()
        )
        all_comments.extend(child_comments)

    tree_comments = _build_comment_tree(all_comments)

    return CommentListResponse(
        items=tree_comments,
        total=total
    )


@router.post("/article/{article_id}", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    article_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    parent_comment = None
    level = 0
    path = ""

    if comment_in.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_in.parent_id
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")

        if parent_comment.article_id != article_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment belongs to a different article"
            )

        if parent_comment.level >= MAX_LEVEL - 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum comment depth is {MAX_LEVEL} levels"
            )

        level = parent_comment.level + 1
        path = f"{parent_comment.path}{parent_comment.id}."

    comment = Comment(
        article_id=article_id,
        user_id=current_user.id,
        parent_id=comment_in.parent_id,
        path=path,
        level=level,
        content=comment_in.content
    )

    db.add(comment)
    article.comment_count += 1
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        article_id=comment.article_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        path=comment.path,
        level=comment.level,
        content=comment.content,
        like_count=comment.like_count,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        user=comment.user,
        replies=[]
    )


@router.post("/{comment_id}/like", response_model=dict)
def toggle_comment_like(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing_like = db.query(CommentLike).filter(
        CommentLike.user_id == current_user.id,
        CommentLike.comment_id == comment_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        comment.like_count = max(0, comment.like_count - 1)
        liked = False
    else:
        like = CommentLike(user_id=current_user.id, comment_id=comment_id)
        db.add(like)
        comment.like_count += 1
        liked = True

    db.commit()
    return {"liked": liked, "like_count": comment.like_count}


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    comment.is_deleted = True
    comment.content = ""

    article = db.query(Article).filter(Article.id == comment.article_id).first()
    if article and article.comment_count > 0:
        article.comment_count -= 1

    db.commit()
    return None
