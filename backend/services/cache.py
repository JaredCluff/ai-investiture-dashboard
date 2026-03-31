import time
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int = 30):
        self._store: dict[str, tuple[Any, float]] = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Any | None:
        if key in self._store:
            value, ts = self._store[key]
            if time.time() - ts < self.ttl:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, time.time())


alpaca_cache = TTLCache(ttl_seconds=30)
