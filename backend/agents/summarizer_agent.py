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
            print(f"📄 [Summarizer] Input received - Article count: {len(articles) if articles else 0}")
            print(f"📄 [Summarizer] Articles type: {type(articles)}")
            
            if articles:
                print(f"📄 [Summarizer] Article sources: {[article.get('source', 'Unknown') for article in articles]}")
                for i, article in enumerate(articles):
                    print(f"📄 [Summarizer] Article {i+1}: '{article.get('title', 'No title')[:50]}...'")
                    print(f"   📝 Content length: {len(article.get('content', ''))}")
            
            if not articles:
                print("❌ [Summarizer] ERROR: No articles provided")
                return self.create_output(
                    data="", success=False, error_message="No articles provided for summarization"
                )

            print(f"📄 [Summarizer] Starting summarization of {len(articles)} articles")
            self.log_info(f"Summarizing {len(articles)} articles")

            summary = await self._create_summary(articles)

            print(f"✅ [Summarizer] Created summary with {len(summary)} characters")
            print(f"📄 [Summarizer] Summary preview: {summary[:200]}...")
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
            print("⚠️  [Summarizer] No articles to summarize")
            return ""

        print(f"📄 [Summarizer] Preparing {len(articles)} articles for summarization...")
        
        # Prepare article content for summarization
        articles_text = []
        for i, article in enumerate(articles, 1):
            content = article.get('content', '')
            truncated_content = content[:1000]
            print(f"📄 [Summarizer] Article {i} - Title: '{article.get('title', 'No title')[:50]}...'")
            print(f"   📰 Source: {article.get('source', 'Unknown')}")
            print(f"   📝 Content length: {len(content)} -> {len(truncated_content)} (truncated)")
            
            article_text = f"""
Article {i}:
Title: {article.get('title', 'No title')}
Source: {article.get('source', 'Unknown')}
Content: {truncated_content}...
"""
            articles_text.append(article_text)

        combined_articles = "\n".join(articles_text)
        print(f"📄 [Summarizer] Combined articles text length: {len(combined_articles)} characters")

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
