import asyncio
from app.services.llm import get_llm_adapter

class SummarizationManager:
    def __init__(self, provider: str = "mistral", target_lang: str = "TR"):
        self.provider = provider
        self.target_lang = target_lang
        self.llm = get_llm_adapter(provider)
        self.sentence_buffer = []
        self.intermediate_summaries = []
        self.context_summary = ""
        self.trigger_count = 6  # Summarize roughly every 6 sentences

    def add_sentence(self, sentence: str) -> None:
        self.sentence_buffer.append(sentence)

    def reset(self) -> None:
        self.sentence_buffer = []
        self.intermediate_summaries = []
        self.context_summary = ""

    def should_trigger_intermediate(self) -> bool:
        return len(self.sentence_buffer) >= self.trigger_count

    async def trigger_intermediate_summary(self) -> str:
        if not self.sentence_buffer:
            return ""
        
        # Take snapshot and clear synchronously to prevent racing in background tasks
        chunk_text = " ".join(self.sentence_buffer)
        self.sentence_buffer = [] 
        
        print(f"BACKGROUND: Generating intermediate summary using {self.provider}...")
        summary = await self.llm.summarize_intermediate(chunk_text, self.context_summary, self.target_lang)
        
        if not summary.startswith("Error") and "API key is missing" not in summary:
            self.intermediate_summaries.append(summary)
            # Update rolling context window with the latest summary
            self.context_summary = summary
        else:
            print("BACKEND: Summary failed -", summary)
            
        return summary

    async def trigger_final_summary(self) -> dict:
        # Purge any remaining sentences into a final intermediate summary
        if self.sentence_buffer:
            await self.trigger_intermediate_summary()

        if not self.intermediate_summaries:
            return {"topics": [], "decisions": [], "actionItems": []}
            
        print(f"BACKGROUND: Generating FINAL summary using {self.provider}...")
        final_json = await self.llm.generate_final_summary(self.intermediate_summaries, self.target_lang)
        return final_json
