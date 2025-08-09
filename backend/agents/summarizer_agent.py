from typing import Dict, List

from openai import AsyncOpenAI

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import OPENAI_API_KEY


class SummarizerAgent(BaseAgent):
    def __init__(self):
        super().__init__("SummarizerAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            articles = input_data.data
            if not articles:
                return self.create_output(
                    data="", success=False, error_message="No articles provided for summarization"
                )

            self.log_info(f"Summarizing {len(articles)} articles")

            summary = await self._create_summary(articles)

            self.log_info(f"Created summary with {len(summary)} characters")

            return self.create_output(
                data=summary,
                metadata={
                    "articles_count": len(articles),
                    "summary_length": len(summary),
                    "sources": [article.get("source", "Unknown") for article in articles],
                },
            )

        except Exception as e:
            self.log_error(f"Error in summarization: {str(e)}")
            return self.create_output(
                data="", success=False, error_message=f"Failed to summarize articles: {str(e)}"
            )

    async def _create_summary(self, articles: List[Dict]) -> str:
        if not articles:
            return ""

        # Prepare article content for summarization
        articles_text = []
        for i, article in enumerate(articles, 1):
            article_text = f"""
Article {i}:
Title: {article.get('title', 'No title')}
Source: {article.get('source', 'Unknown')}
Content: {article.get('content', '')[:1000]}...
"""
            articles_text.append(article_text)

        combined_articles = "\n".join(articles_text)

        summarization_prompt = f"""
You are a professional news analyst. Please create a coherent, factual summary of the following news articles about current events.

Requirements:
- Create 2-3 comprehensive paragraphs
- Maintain chronological order where possible
- Focus on the most important developments
- Preserve factual accuracy
- Avoid speculation or opinion
- Include key figures, locations, and events mentioned

Articles to summarize:
{combined_articles}

Please provide a concise but comprehensive summary:"""

        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": summarization_prompt}],
            temperature=0.3,
            max_tokens=800,
        )

        return response.choices[0].message.content.strip()
