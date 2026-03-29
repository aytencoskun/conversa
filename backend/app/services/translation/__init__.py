from app.services.translation.base import TranslationAdapter
from app.services.translation.deepl_adapter import DeepLAdapter
from app.services.translation.libre_adapter import LibreTranslateAdapter


def get_translation_adapter(provider: str = "libre") -> TranslationAdapter:
    """
    Factory: return the correct translation adapter for the given provider name.
    Supported: "deepl", "libre"
    """
    provider = provider.lower().strip()
    if provider == "deepl":
        return DeepLAdapter()
    elif provider in ("libre", "libretranslate"):
        return LibreTranslateAdapter()
    else:
        raise ValueError(f"Unknown translation provider: '{provider}'. Use 'deepl' or 'libre'.")
