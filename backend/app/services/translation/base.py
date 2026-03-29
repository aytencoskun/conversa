from abc import ABC, abstractmethod


class TranslationAdapter(ABC):
    """Abstract base class for all translation API adapters."""

    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translate `text` from `source_lang` to `target_lang`.
        Language codes follow the ISO 639-1 standard (e.g. "EN", "TR", "DE").
        Returns the translated text string.
        """
        ...
