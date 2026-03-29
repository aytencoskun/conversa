from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from app.services.translation import get_translation_adapter
from app.core.translation_cache import translation_cache

router = APIRouter()
logger = logging.getLogger(__name__)


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "EN"
    target_lang: str = "TR"
    provider: str = "libre"  # "libre" or "deepl"


class TranslateResponse(BaseModel):
    translated_text: str
    provider: str


@router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    """Translate text using the selected translation provider."""
    # Check cache first
    cached = translation_cache.get(
        request.text, request.source_lang, request.target_lang, request.provider
    )
    if cached:
        return TranslateResponse(translated_text=cached, provider=request.provider)

    try:
        adapter = get_translation_adapter(request.provider)
        translated = await adapter.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )
        translation_cache.put(
            request.text, request.source_lang, request.target_lang, request.provider, translated
        )
        return TranslateResponse(translated_text=translated, provider=request.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
