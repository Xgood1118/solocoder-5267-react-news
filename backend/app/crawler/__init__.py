__all__ = [
    "start_scheduler",
    "stop_scheduler",
    "crawl_source",
    "crawl_all_sources",
    "parse_feed",
    "extract_full_content",
    "extract_keywords",
    "check_content_similarity",
    "polite_request",
    "get_random_user_agent",
    "get_random_delay",
]


def __getattr__(name):
    if name in ("start_scheduler", "stop_scheduler", "crawl_source", "crawl_all_sources"):
        from .scheduler import (
            start_scheduler, stop_scheduler, crawl_source, crawl_all_sources
        )
        return locals()[name]
    if name in ("parse_feed", "extract_full_content", "extract_keywords", "check_content_similarity"):
        from .feed_parser import (
            parse_feed, extract_full_content, extract_keywords, check_content_similarity
        )
        return locals()[name]
    if name in ("polite_request", "get_random_user_agent", "get_random_delay"):
        from .polite_request import polite_request, get_random_user_agent, get_random_delay
        return locals()[name]
    raise AttributeError(f"module 'crawler' has no attribute '{name}'")
