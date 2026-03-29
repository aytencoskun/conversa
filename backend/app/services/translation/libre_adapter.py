import os
import logging
import httpx

from app.services.translation.base import TranslationAdapter

logger = logging.getLogger(__name__)

DEFAULT_LIBRE_URL = "http://localhost:5001"


class LibreTranslateAdapter(TranslationAdapter):
    """Translation adapter for a self-hosted LibreTranslate instance."""

    def __init__(self):
        self.base_url = os.environ.get("LIBRETRANSLATE_URL", DEFAULT_LIBRE_URL).rstrip("/")
        self.api_key = os.environ.get("LIBRETRANSLATE_API_KEY", "")  # optional
        logger.info(f"LibreTranslate adapter configured: {self.base_url}")

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        payload = {
            "q": text,
            "source": source_lang.lower()[:2],  # LibreTranslate uses 2-letter lowercase codes
            "target": target_lang.lower()[:2],
            "format": "text",
        }
        if self.api_key:
            payload["api_key"] = self.api_key

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{self.base_url}/translate", json=payload)
            response.raise_for_status()
            data = response.json()

        translated = data["translatedText"]
        logger.info(f"LibreTranslate: '{text}' -> '{translated}' ({source_lang}->{target_lang})")
        return translated
