import os
import json
import httpx
from app.services.llm.base import LLMAdapter

class MistralAdapter(LLMAdapter):
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY", "aQmnpNMSZU6JtIYtfBHu1trFMZjhVo9r")
        self.url = "https://api.mistral.ai/v1/chat/completions"

    async def summarize_intermediate(self, text: str, context: str = "", target_lang: str = "EN") -> str:
        if not self.api_key:
            return "Mistral API key is missing. Cannot summarize."
            
        prompt = f"Summarize the following meeting segment concisely. IMPORTANT: Write the summary entirely in {target_lang} language.\n\nContext so far: {context}\n\nSegment: {text}"
        payload = {
            "model": "mistral-small-latest",
            "messages": [
                {"role": "system", "content": "You are a professional meeting assistant. Keep summaries brief, professional and informative."},
                {"role": "user", "content": prompt}
            ]
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.url, json=payload, headers=headers)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            return f"Error from Mistral API: {resp.text}"

    async def generate_final_summary(self, intermediate_summaries: list[str], target_lang: str = "EN") -> dict:
        if not self.api_key:
            return {"topics": [], "decisions": [], "actionItems": [], "paragraph": {"short": "", "medium": "", "long": ""}, "bulletPoints": {"short": [], "medium": [], "long": []}}
            
        combined = "\n\n".join(intermediate_summaries)
        prompt = (
            "Output ONLY valid JSON matching this exact structure: "
            '{"topics": [{"id":"...", "title":"...", "description":"..."}], '
            '"decisions": [{"id":"...", "description":"..."}], '
            '"actionItems": [{"id":"...", "description":"...", "isCompleted":false, "assignee":"..."}], '
            '"paragraph": {"short": "1-2 sentence summary", "medium": "3-5 sentence summary", "long": "detailed multi-paragraph summary"}, '
            '"bulletPoints": {"short": ["bullet1","bullet2"], "medium": ["bullet1","bullet2","bullet3","bullet4"], "long": ["bullet1","bullet2",...,"bullet8+"]}}\n'
            f"IMPORTANT: Write ALL text inside the JSON strictly in {target_lang} language.\n\n"
            f"Meeting Summary chunks:\n{combined}"
        )
        payload = {
            "model": "mistral-small-latest",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "You are a JSON generating API. Do not include markdown formatting or backticks around the JSON."},
                {"role": "user", "content": prompt}
            ]
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        empty_result = {
            "topics": [], "decisions": [], "actionItems": [],
            "paragraph": {"short": "", "medium": "", "long": ""},
            "bulletPoints": {"short": [], "medium": [], "long": []}
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(self.url, json=payload, headers=headers)
            if resp.status_code == 200:
                try:
                    content = resp.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    # Ensure all expected keys exist
                    for key in empty_result:
                        if key not in parsed:
                            parsed[key] = empty_result[key]
                    return parsed
                except Exception as e:
                    print("Mistral JSON parsing error:", e)
            print(f"Mistral failure: {resp.status_code} {resp.text}")
            return empty_result
