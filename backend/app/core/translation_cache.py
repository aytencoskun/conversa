import hashlib
import logging
from collections import OrderedDict

logger = logging.getLogger(__name__)

# Max cached entries (LRU eviction after this)
DEFAULT_MAX_SIZE = 1000


class TranslationCache:
    """
    In-memory LRU translation cache using MD5 hash keys.
    Prevents redundant API calls for identical text+language combinations.
    """

    def __init__(self, max_size: int = DEFAULT_MAX_SIZE):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    @staticmethod
    def _make_key(text: str, source_lang: str, target_lang: str, provider: str) -> str:
        """Create an MD5 hash key from the translation parameters."""
        raw = f"{provider}:{source_lang}:{target_lang}:{text}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    def get(self, text: str, source_lang: str, target_lang: str, provider: str) -> str | None:
        """Return cached translation or None if not found."""
        key = self._make_key(text, source_lang, target_lang, provider)
        if key in self._cache:
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self._hits += 1
            logger.debug(f"Cache HIT ({self._hits} total): {text[:40]}...")
            return self._cache[key]
        self._misses += 1
        return None

    def put(self, text: str, source_lang: str, target_lang: str, provider: str, translated: str):
        """Store a translation in the cache."""
        key = self._make_key(text, source_lang, target_lang, provider)
        self._cache[key] = translated
        self._cache.move_to_end(key)
        # Evict oldest if over capacity
        if len(self._cache) > self._max_size:
            evicted_key, _ = self._cache.popitem(last=False)
            logger.debug(f"Cache evicted oldest entry. Size: {len(self._cache)}")

    def stats(self) -> dict:
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{self._hits / max(1, self._hits + self._misses) * 100:.1f}%",
        }

    def clear(self):
        self._cache.clear()
        self._hits = 0
        self._misses = 0


# Singleton instance
translation_cache = TranslationCache()
