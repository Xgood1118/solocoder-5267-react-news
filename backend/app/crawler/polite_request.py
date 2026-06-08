import random
import time
from typing import List, Optional
import httpx

from ..config import get_settings

settings = get_settings()

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]


def get_random_user_agent() -> str:
    return random.choice(USER_AGENTS)


def get_random_delay() -> float:
    return random.uniform(settings.CRAWLER_DELAY_MIN, settings.CRAWLER_DELAY_MAX)


def polite_request(
    url: str,
    method: str = "GET",
    max_retries: Optional[int] = None,
    timeout: Optional[int] = None,
    **kwargs
) -> Optional[httpx.Response]:
    if max_retries is None:
        max_retries = settings.CRAWLER_MAX_RETRIES
    if timeout is None:
        timeout = settings.CRAWLER_TIMEOUT

    headers = kwargs.get("headers", {})
    if "User-Agent" not in headers:
        headers["User-Agent"] = get_random_user_agent()
    kwargs["headers"] = headers

    response = None
    for attempt in range(max_retries):
        try:
            delay = get_random_delay()
            time.sleep(delay)

            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                response = client.request(method, url, **kwargs)

            if response.status_code == 200:
                return response

            if response.status_code in [403, 429]:
                raise httpx.HTTPStatusError(
                    f"Blocked with status {response.status_code}",
                    request=response.request,
                    response=response
                )

            if attempt < max_retries - 1:
                backoff = 2 ** attempt
                time.sleep(backoff)

        except (httpx.TimeoutException, httpx.ConnectError, httpx.HTTPStatusError):
            if attempt < max_retries - 1:
                backoff = 2 ** attempt
                time.sleep(backoff)
            else:
                raise

    return response
