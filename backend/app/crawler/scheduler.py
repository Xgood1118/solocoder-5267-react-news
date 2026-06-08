import logging
from datetime import datetime, timedelta
from typing import List
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Source, Article, CrawlLog, ArticleTag
from ..config import get_settings
from .feed_parser import parse_feed, extract_full_content, extract_keywords
from ..search import index_article

settings = get_settings()
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def crawl_source(source_id: int) -> dict:
    db = SessionLocal()
    start_time = datetime.utcnow()
    result = {
        "status": "success",
        "message": "",
        "articles_fetched": 0,
        "duration_ms": 0
    }

    try:
        source = db.query(Source).filter(Source.id == source_id).first()
        if not source:
            result["status"] = "failed"
            result["message"] = "Source not found"
            return result

        if not source.is_enabled:
            result["status"] = "skipped"
            result["message"] = "Source is disabled"
            return result

        if source.cooldown_until and source.cooldown_until > datetime.utcnow():
            result["status"] = "cooldown"
            result["message"] = f"Source is in cooldown until {source.cooldown_until}"
            return result

        articles_data = parse_feed(source.url, source.feed_type)
        new_count = 0

        for article_data in articles_data:
            existing = db.query(Article).filter(
                (Article.url == article_data["url"]) |
                (Article.content_hash == article_data["content_hash"])
            ).first()

            if existing:
                continue

            article = Article(
                source_id=source.id,
                title=article_data["title"],
                url=article_data["url"],
                summary=article_data["summary"],
                author=article_data["author"],
                published_at=article_data["published_at"],
                content_hash=article_data["content_hash"],
                simhash=article_data["simhash"]
            )
            db.add(article)
            db.flush()

            keywords = extract_keywords(
                article_data["title"] + " " + article_data["summary"]
            )
            for keyword in keywords:
                tag = ArticleTag(
                    article_id=article.id,
                    tag=keyword,
                    is_auto=True
                )
                db.add(tag)

            new_count += 1

        if new_count > 0:
            db.commit()

            articles_with_content = db.query(Article).filter(
                Article.source_id == source.id,
                Article.is_processed == False
            ).limit(10).all()

            for article in articles_with_content:
                content = extract_full_content(article.url, source.custom_selector)
                if content:
                    article.content = content
                    article.is_processed = True
                    index_article(
                        db,
                        article_id=article.id,
                        title=article.title,
                        summary=article.summary,
                        content=article.content,
                        author=article.author
                    )

            db.commit()

        source.last_crawled_at = datetime.utcnow()
        source.last_success_at = datetime.utcnow()
        source.failure_count = 0

        result["articles_fetched"] = new_count
        result["message"] = f"Successfully fetched {new_count} new articles"

    except Exception as e:
        db.rollback()
        logger.error(f"Error crawling source {source_id}: {str(e)}")

        source = db.query(Source).filter(Source.id == source_id).first()
        if source:
            source.failure_count += 1
            source.last_crawled_at = datetime.utcnow()

            if source.failure_count >= 5:
                source.cooldown_until = datetime.utcnow() + timedelta(
                    hours=settings.CRAWLER_COOLDOWN_HOURS
                )
                result["status"] = "cooldown"
                result["message"] = f"Too many failures, cooldown for {settings.CRAWLER_COOLDOWN_HOURS}h"
            else:
                result["status"] = "failed"
                result["message"] = str(e)
        else:
            result["status"] = "failed"
            result["message"] = str(e)

    finally:
        end_time = datetime.utcnow()
        duration = int((end_time - start_time).total_seconds() * 1000)
        result["duration_ms"] = duration

        try:
            log = CrawlLog(
                source_id=source_id,
                status=result["status"],
                message=result["message"],
                articles_fetched=result["articles_fetched"],
                duration_ms=duration
            )
            db.add(log)
            db.commit()
        except Exception as log_error:
            logger.error(f"Error saving crawl log: {str(log_error)}")

        db.close()

    return result


def crawl_all_sources():
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.is_enabled == True).all()
        logger.info(f"Starting crawl for {len(sources)} sources")

        for source in sources:
            if source.cooldown_until and source.cooldown_until > datetime.utcnow():
                continue
            crawl_source(source.id)

        logger.info("Crawl completed")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        crawl_all_sources,
        trigger=IntervalTrigger(minutes=settings.CRAWLER_INTERVAL_MINUTES),
        id="crawl_all_sources",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"Scheduler started with {settings.CRAWLER_INTERVAL_MINUTES}min interval")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
