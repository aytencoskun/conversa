import os
import json
from openai import AsyncOpenAI
from app.services.llm.base import LLMAdapter

class OpenAIAdapter(LLMAdapter):
    def __init__(self):
        # Relies on OPENAI_API_KEY environment variable
        self.client = AsyncOpenAI()

    async def summarize_intermediate(self, text: str, context: str = "", target_lang: str = "EN") -> str:
        prompt = f"Summarize the following meeting segment concisely. IMPORTANT: Write the summary entirely in {target_lang} language.\n\nContext so far: {context}\n\nSegment: {text}"
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a meeting assistant. Keep summaries brief, professional and informative."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    async def generate_final_summary(self, intermediate_summaries: list[str], target_lang: str = "EN") -> dict:
        combined = "\n\n".join(intermediate_summaries)
        prompt = (
            "Generate a final structured JSON summary of the meeting. "
            "Include 'topics' (list of {id, title, description}), 'decisions' (list of {id, description}), "
            "'actionItems' (list of {id, description, isCompleted, assignee}), "
            "'paragraph' ({short: '1-2 sentences', medium: '3-5 sentences', long: 'detailed multi-paragraph'}), "
            "and 'bulletPoints' ({short: ['2 bullets'], medium: ['4 bullets'], long: ['8+ bullets']}).\n"
            f"IMPORTANT: Write ALL text inside the JSON strictly in {target_lang} language.\n\n"
            f"Meeting Summary chunks:\n{combined}"
        )
        empty_result = {
            "topics": [], "decisions": [], "actionItems": [],
            "paragraph": {"short": "", "medium": "", "long": ""},
            "bulletPoints": {"short": [], "medium": [], "long": []}
        }
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": "You are a professional meeting summarizer. Always output strictly valid JSON conforming to the requested schema."},
                {"role": "user", "content": prompt}
            ]
        )
        try:
            parsed = json.loads(response.choices[0].message.content)
            # Ensure all expected keys exist
            for key in empty_result:
                if key not in parsed:
                    parsed[key] = empty_result[key]
            return parsed
        except Exception as e:
            print("Failed to parse JSON from OpenAI:", e)
            return empty_result
