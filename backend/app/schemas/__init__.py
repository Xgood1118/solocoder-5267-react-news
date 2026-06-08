from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class SourceBase(BaseModel):
    name: str
    url: str
    feed_type: str = "rss"
    description: str = ""
    custom_selector: str = ""


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    feed_type: Optional[str] = None
    description: Optional[str] = None
    custom_selector: Optional[str] = None
    is_enabled: Optional[bool] = None


class SourceResponse(SourceBase):
    id: int
    site_url: str = ""
    icon_url: str = ""
    is_enabled: bool
    last_crawled_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    failure_count: int = 0
    created_at: datetime
    subscriber_count: int = 0

    class Config:
        from_attributes = True


class ArticleTagResponse(BaseModel):
    tag: str
    is_auto: bool

    class Config:
        from_attributes = True


class ArticleBase(BaseModel):
    title: str
    url: str
    summary: str = ""
    author: str = ""
    published_at: Optional[datetime] = None


class ArticleResponse(ArticleBase):
    id: int
    source_id: int
    content: str = ""
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime
    source: Optional[SourceResponse] = None
    tags: List[ArticleTagResponse] = []
    is_liked: bool = False
    is_favorited: bool = False
    is_read_later: bool = False

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    items: List[ArticleResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentCreate(CommentBase):
    parent_id: Optional[int] = None


class CommentUserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class CommentResponse(CommentBase):
    id: int
    article_id: int
    user_id: int
    parent_id: Optional[int] = None
    path: str = ""
    level: int = 0
    like_count: int = 0
    is_deleted: bool = False
    created_at: datetime
    user: CommentUserResponse
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()


class CommentListResponse(BaseModel):
    items: List[CommentResponse]
    total: int


class SubscriptionBase(BaseModel):
    source_id: int
    category: str = "default"


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    created_at: datetime
    source: Optional[SourceResponse] = None

    class Config:
        from_attributes = True


class LikeActionResponse(BaseModel):
    liked: bool
    like_count: int


class FavoriteActionResponse(BaseModel):
    favorited: bool


class ReadLaterActionResponse(BaseModel):
    saved: bool


class SearchResultArticle(BaseModel):
    id: int
    title: str
    url: str
    summary: str
    author: str
    published_at: Optional[datetime] = None
    source_id: int
    source_name: str = ""
    highlight: Optional[str] = ""
    score: float = 0.0


class SearchResponse(BaseModel):
    items: List[SearchResultArticle]
    total: int
    page: int
    page_size: int
    query: str


class NotificationBase(BaseModel):
    type: str
    title: str
    content: str = ""
    related_id: Optional[int] = None


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int


class CrawlLogResponse(BaseModel):
    id: int
    source_id: int
    status: str
    message: str
    articles_fetched: int
    duration_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReadHistoryResponse(BaseModel):
    id: int
    article_id: int
    read_at: datetime
    article: Optional[ArticleResponse] = None

    class Config:
        from_attributes = True
