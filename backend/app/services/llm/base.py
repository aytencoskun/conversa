from abc import ABC, abstractmethod
from typing import Dict, Any, List

class LLMAdapter(ABC):
    @abstractmethod
    async def summarize_intermediate(self, text: str, context: str = "", target_lang: str = "EN") -> str:
        """Continuously summarize the latest chunk of sentences given previous context."""
        pass

    @abstractmethod
    async def generate_final_summary(self, intermediate_summaries: List[str], target_lang: str = "EN") -> Dict[str, Any]:
        """Produce the final structured summary for the meeting end."""
        pass
