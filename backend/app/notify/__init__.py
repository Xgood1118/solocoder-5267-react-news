from typing import List
from sqlalchemy.orm import Session

from ..models import Notification, User, Article, Source, Subscription


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    content: str = "",
    related_id: int = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        content=content,
        related_id=related_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_new_articles(db: Session, source_id: int, articles: List[Article]):
    if not articles:
        return

    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        return

    subscriptions = db.query(Subscription).filter(
        Subscription.source_id == source_id
    ).all()

    article_count = len(articles)
    article_titles = "\n".join([f"- {a.title}" for a in articles[:5]])

    for sub in subscriptions:
        title = f"{source.name} 更新了 {article_count} 篇文章"
        content = f"{source.name} 有新文章发布：\n{article_titles}"
        if article_count > 5:
            content += f"\n... 还有 {article_count - 5} 篇"

        create_notification(
            db,
            user_id=sub.user_id,
            type="article_new",
            title=title,
            content=content,
            related_id=source_id
        )


def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    from ..config import get_settings
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception:
        return False


def send_daily_digest(db: Session):
    from datetime import datetime, timedelta
    from ..config import get_settings

    settings = get_settings()

    one_day_ago = datetime.utcnow() - timedelta(days=1)

    users = db.query(User).filter(User.is_active == True).all()

    for user in users:
        subscribed_source_ids = db.query(Subscription.source_id).filter(
            Subscription.user_id == user.id
        ).subquery()

        new_articles = db.query(Article).filter(
            Article.source_id.in_(subscribed_source_ids),
            Article.created_at >= one_day_ago
        ).all()

        if not new_articles:
            continue

        if len(new_articles) < settings.NOTIFICATION_BATCH_SIZE:
            continue

        title = f"今日要闻：{len(new_articles)} 篇新文章"
        content_parts = [f"今天有 {len(new_articles)} 篇新文章等你阅读：\n"]

        for article in new_articles[:10]:
            content_parts.append(f"- {article.title}")
            if article.summary:
                content_parts.append(f"  {article.summary[:100]}")
            content_parts.append("")

        body = "\n".join(content_parts)

        send_email_notification(user.email, title, body)

        create_notification(
            db,
            user_id=user.id,
            type="system",
            title=title,
            content=body
        )
