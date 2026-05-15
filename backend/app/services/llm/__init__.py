import os
from app.services.llm.base import LLMAdapter

def get_llm_adapter(provider_name: str = None) -> LLMAdapter:
    if not provider_name:
        provider_name = os.getenv("LLM_PROVIDER", "openai")
    
    provider_name = provider_name.lower()
    if provider_name == "mistral":
        from app.services.llm.mistral_adapter import MistralAdapter
        return MistralAdapter()
    else:
        # Default to OpenAI
        from app.services.llm.openai_adapter import OpenAIAdapter
        return OpenAIAdapter()
