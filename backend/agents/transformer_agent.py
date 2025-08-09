from openai import AsyncOpenAI

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import OPENAI_API_KEY


class TransformerAgent(BaseAgent):
    def __init__(self):
        super().__init__("TransformerAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            user_prompt = input_data.data
            self.log_info(f"Processing user prompt: {user_prompt}")

            extraction_prompt = f"""
Extract the most important keywords for searching current events and news from this user question: "{user_prompt}"

Focus on:
- Country names
- Political figures
- Major events or conflicts
- Economic terms
- International organizations

Return only the most relevant 3-5 keywords separated by commas, suitable for news search.

Example:
User: "What's happening with the war in Ukraine?"
Keywords: Ukraine, war, Russia, conflict

User prompt: {user_prompt}
Keywords:"""

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": extraction_prompt}],
                temperature=0.3,
                max_tokens=100,
            )

            keywords_text = response.choices[0].message.content.strip()
            keywords = [kw.strip() for kw in keywords_text.split(",") if kw.strip()]

            self.log_info(f"Extracted keywords: {keywords}")

            return self.create_output(
                data=keywords,
                metadata={"original_prompt": user_prompt, "keywords_raw": keywords_text},
            )

        except Exception as e:
            self.log_error(f"Error in keyword extraction: {str(e)}")
            return self.create_output(
                data=[], success=False, error_message=f"Failed to extract keywords: {str(e)}"
            )
