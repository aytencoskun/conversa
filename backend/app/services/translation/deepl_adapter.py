import os
import logging
import httpx

from app.services.translation.base import TranslationAdapter

logger = logging.getLogger(__name__)

DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate"


class DeepLAdapter(TranslationAdapter):
    """Translation adapter for DeepL Free API."""

    def __init__(self):
        self.api_key = os.environ.get("DEEPL_API_KEY", "")
        if not self.api_key:
            logger.warning(
                "DEEPL_API_KEY environment variable is not set. "
                "DeepL translations will fail until it is configured."
            )

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.api_key:
            raise RuntimeError("DEEPL_API_KEY is not configured.")

        headers = {
            "Authorization": f"DeepL-Auth-Key {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "text": [text],
            "source_lang": source_lang.upper(),
            "target_lang": target_lang.upper(),
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(DEEPL_FREE_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        translated = data["translations"][0]["text"]
        logger.info(f"DeepL: '{text}' -> '{translated}' ({source_lang}->{target_lang})")
        return translated
