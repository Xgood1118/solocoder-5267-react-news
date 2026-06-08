from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Source, Subscription, User
from ..schemas import SourceCreate, SourceUpdate, SourceResponse, SubscriptionResponse
from ..core.security import get_current_user, get_current_admin_user

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=List[SourceResponse])
def list_sources(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    feed_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Source).filter(Source.is_enabled == True)

    if search:
        query = query.filter(Source.name.contains(search))
    if feed_type:
        query = query.filter(Source.feed_type == feed_type)

    sources = query.order_by(Source.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for source in sources:
        source_dict = SourceResponse.model_validate(source).model_dump()
        source_dict["subscriber_count"] = db.query(Subscription).filter(
            Subscription.source_id == source.id
        ).count()
        result.append(SourceResponse(**source_dict))

    return result


@router.get("/{source_id}", response_model=SourceResponse)
def get_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    source_dict = SourceResponse.model_validate(source).model_dump()
    source_dict["subscriber_count"] = db.query(Subscription).filter(
        Subscription.source_id == source.id
    ).count()
    return SourceResponse(**source_dict)


@router.post("", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_source(
    source_in: SourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_source = db.query(Source).filter(Source.url == source_in.url).first()
    if existing_source:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source with this URL already exists"
        )

    source = Source(**source_in.model_dump(), created_by=current_user.id)
    db.add(source)
    db.commit()
    db.refresh(source)

    subscription = Subscription(user_id=current_user.id, source_id=source.id)
    db.add(subscription)
    db.commit()

    source_dict = SourceResponse.model_validate(source).model_dump()
    source_dict["subscriber_count"] = 1
    return SourceResponse(**source_dict)


@router.put("/{source_id}", response_model=SourceResponse)
def update_source(
    source_id: int,
    source_in: SourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.created_by != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    update_data = source_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(source, field, value)

    db.commit()
    db.refresh(source)

    source_dict = SourceResponse.model_validate(source).model_dump()
    source_dict["subscriber_count"] = db.query(Subscription).filter(
        Subscription.source_id == source.id
    ).count()
    return SourceResponse(**source_dict)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.created_by != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    db.delete(source)
    db.commit()
    return None


@router.post("/{source_id}/subscribe", response_model=SubscriptionResponse)
def subscribe_source(
    source_id: int,
    category: str = "default",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    existing_sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.source_id == source_id
    ).first()
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this source"
        )

    subscription = Subscription(
        user_id=current_user.id,
        source_id=source_id,
        category=category
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return subscription


@router.delete("/{source_id}/subscribe", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.source_id == source_id
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(subscription)
    db.commit()
    return None


@router.get("/subscriptions/mine", response_model=List[SubscriptionResponse])
def get_my_subscriptions(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Subscription).filter(Subscription.user_id == current_user.id)
    if category:
        query = query.filter(Subscription.category == category)

    subscriptions = query.order_by(Subscription.created_at.desc()).all()
    return subscriptions
