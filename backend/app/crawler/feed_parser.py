import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import feedparser
from simhash import Simhash
import jieba
from bs4 import BeautifulSoup

from .polite_request import polite_request


def _parse_date(date_str) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        if hasattr(date_str, 'tm_year'):
            return datetime(*date_str[:6])
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def parse_feed(feed_url: str, feed_type: str = "rss") -> List[Dict]:
    response = polite_request(feed_url)
    if not response or response.status_code != 200:
        raise Exception(f"Failed to fetch feed: {feed_url}")

    content = response.text
    feed = feedparser.parse(content)

    articles = []
    for entry in feed.entries:
        title = entry.get("title", "")
        url = entry.get("link", "")
        summary = entry.get("summary", "")
        author = entry.get("author", "")

        if summary:
            soup = BeautifulSoup(summary, "html.parser")
            summary = soup.get_text(strip=True)[:500]

        published_at = _parse_date(entry.get("published_parsed") or entry.get("updated_parsed"))

        content_hash = hashlib.sha256((title + url).encode("utf-8")).hexdigest()

        simhash_value = _calculate_simhash(title + " " + summary)

        articles.append({
            "title": title,
            "url": url,
            "summary": summary,
            "author": author,
            "published_at": published_at,
            "content_hash": content_hash,
            "simhash": simhash_value,
            "content": ""
        })

    return articles


def _calculate_simhash(text: str) -> str:
    if not text.strip():
        return "0" * 64

    words = jieba.lcut(text)
    sh = Simhash(words)
    return format(sh.value, '064b')


def extract_full_content(url: str, custom_selector: str = "") -> str:
    try:
        response = polite_request(url)
        if not response or response.status_code != 200:
            return ""

        html = response.text

        if custom_selector:
            soup = BeautifulSoup(html, "html.parser")
            element = soup.select_one(custom_selector)
            if element:
                return element.get_text(strip=True, separator="\n")[:10000]

        try:
            from readability import Document
            doc = Document(html)
            content_html = doc.summary()
            content_soup = BeautifulSoup(content_html, "html.parser")
            return content_soup.get_text(strip=True, separator="\n")[:10000]
        except ImportError:
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            main_content = soup.find("article") or soup.find("main") or soup.body
            if main_content:
                return main_content.get_text(strip=True, separator="\n")[:10000]
            return ""

    except Exception:
        return ""


def extract_keywords(text: str, top_k: int = 5) -> List[str]:
    if not text.strip():
        return []

    try:
        import jieba.analyse
        keywords = jieba.analyse.extract_tags(text, topK=top_k)
        return keywords
    except Exception:
        words = jieba.lcut(text)
        word_count = {}
        for word in words:
            if len(word) >= 2:
                word_count[word] = word_count.get(word, 0) + 1

        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:top_k]]


def check_content_similarity(simhash1: str, simhash2: str, threshold: int = 3) -> bool:
    if not simhash1 or not simhash2:
        return False
    try:
        i1 = int(simhash1, 2)
        i2 = int(simhash2, 2)
        distance = bin(i1 ^ i2).count("1")
        return distance <= threshold
    except (ValueError, TypeError):
        return False
