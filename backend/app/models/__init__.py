from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Table, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("ArticleLike", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    read_history = relationship("ReadHistory", back_populates="user", cascade="all, delete-orphan")
    read_later = relationship("ReadLater", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


source_user_association = Table(
    "source_user_association",
    Base.metadata,
    Column("source_id", Integer, ForeignKey("sources.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
)


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    feed_type = Column(String(20), default="rss")  # rss, atom, json, custom
    description = Column(Text, default="")
    site_url = Column(String(500), default="")
    icon_url = Column(String(500), default="")
    custom_selector = Column(String(200), default="")
    is_enabled = Column(Boolean, default=True)
    last_crawled_at = Column(DateTime, nullable=True)
    last_success_at = Column(DateTime, nullable=True)
    failure_count = Column(Integer, default=0)
    cooldown_until = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    articles = relationship("Article", back_populates="source", cascade="all, delete-orphan")
    subscribers = relationship("Subscription", back_populates="source", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "source_id", name="unique_user_source"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    category = Column(String(50), default="default")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    source = relationship("Source", back_populates="subscribers")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False, index=True)
    summary = Column(Text, default="")
    content = Column(Text, default="")
    author = Column(String(200), default="")
    published_at = Column(DateTime, nullable=True, index=True)
    content_hash = Column(String(64), index=True)
    simhash = Column(String(64), index=True)
    is_processed = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="articles")
    tags = relationship("ArticleTag", back_populates="article", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")
    likes = relationship("ArticleLike", back_populates="article", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="article", cascade="all, delete-orphan")
    read_history = relationship("ReadHistory", back_populates="article", cascade="all, delete-orphan")
    read_later = relationship("ReadLater", back_populates="article", cascade="all, delete-orphan")


class ArticleTag(Base):
    __tablename__ = "article_tags"
    __table_args__ = (UniqueConstraint("article_id", "tag", name="unique_article_tag"),)

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    tag = Column(String(50), nullable=False, index=True)
    is_auto = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("Article", back_populates="tags")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    path = Column(String(500), default="", index=True)
    level = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    article = relationship("Article", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id])


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (UniqueConstraint("user_id", "comment_id", name="unique_user_comment_like"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ArticleLike(Base):
    __tablename__ = "article_likes"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="unique_user_article_like"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="likes")
    article = relationship("Article", back_populates="likes")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="unique_user_favorite"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    folder = Column(String(50), default="default")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    article = relationship("Article", back_populates="favorites")


class ReadHistory(Base):
    __tablename__ = "read_history"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="unique_user_read_history"),
        Index("idx_user_read_at", "user_id", "read_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)
    read_duration = Column(Integer, default=0)

    user = relationship("User", back_populates="read_history")
    article = relationship("Article", back_populates="read_history")


class ReadLater(Base):
    __tablename__ = "read_later"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="unique_user_read_later"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="read_later")
    article = relationship("Article", back_populates="read_later")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(20), default="system")  # system, article_new, comment, mention
    title = Column(String(200), nullable=False)
    content = Column(Text, default="")
    related_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    status = Column(String(20), default="success")  # success, failed, cooldown
    message = Column(Text, default="")
    articles_fetched = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
