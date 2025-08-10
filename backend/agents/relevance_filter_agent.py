from typing import Dict, List
import json

from openai import AsyncOpenAI

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import OPENAI_API_KEY


class RelevanceFilterAgent(BaseAgent):
    def __init__(self):
        super().__init__("RelevanceFilterAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            data = input_data.data
            articles = data.get("articles", [])
            original_question = data.get("original_question", "")
            
            print(f"🎯 [RelevanceFilter] Input received:")
            print(f"   📋 Articles count: {len(articles)}")
            print(f"   ❓ Original question: '{original_question}'")
            
            if not articles:
                print("❌ [RelevanceFilter] ERROR: No articles provided")
                return self.create_output(
                    data=[], success=False, error_message="No articles provided for relevance filtering"
                )
            
            if not original_question:
                print("❌ [RelevanceFilter] ERROR: No original question provided")
                return self.create_output(
                    data=[], success=False, error_message="No original question provided for relevance filtering"
                )

            print(f"🎯 [RelevanceFilter] Starting AI relevance analysis...")
            
            relevant_articles = await self._filter_relevant_articles(articles, original_question)
            
            print(f"✅ [RelevanceFilter] Filtered {len(articles)} -> {len(relevant_articles)} relevant articles")
            print(f"🎯 [RelevanceFilter] Relevant articles:")
            for i, article in enumerate(relevant_articles):
                print(f"   {i+1}. '{article.get('title', 'No title')[:50]}...' from {article.get('source', 'Unknown')}")

            return self.create_output(
                data=relevant_articles,
                metadata={
                    "original_question": original_question,
                    "articles_processed": len(articles),
                    "articles_filtered": len(relevant_articles),
                    "filter_method": "ai_relevance_analysis"
                },
            )

        except Exception as e:
            print(f"❌ [RelevanceFilter] ERROR: {str(e)}")
            self.log_error(f"Error in relevance filtering: {str(e)}")
            return self.create_output(
                data=[], success=False, error_message=f"Failed to filter articles for relevance: {str(e)}"
            )

    async def _filter_relevant_articles(self, articles: List[Dict], original_question: str) -> List[Dict]:
        """Use AI to determine which articles are relevant to the original question"""
        
        # Prepare article summaries for AI analysis
        article_summaries = []
        for i, article in enumerate(articles):
            article_summary = {
                "index": i,
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "source": article.get("source", ""),
                "content_preview": article.get("content", "")[:200] + "..." if len(article.get("content", "")) > 200 else article.get("content", "")
            }
            article_summaries.append(article_summary)
        
        print(f"🤖 [RelevanceFilter] Sending {len(article_summaries)} articles to OpenAI for relevance analysis...")
        
        relevance_prompt = f"""
You are an expert news analyst. Given a user's question and a list of news articles, determine which articles are DIRECTLY relevant to answering the user's question.

User Question: "{original_question}"

Articles to analyze:
{json.dumps(article_summaries, indent=2)}

For each article, determine if it is directly relevant to the user's question. An article is considered relevant if:
1. It directly addresses the topic, countries, or events mentioned in the question
2. It provides information that would help answer the user's question
3. It's not just tangentially related but actually contains useful information for the response

Respond with a JSON object containing only the indices of the relevant articles:
{{
    "relevant_article_indices": [0, 2, 3],
    "reasoning": "Brief explanation of why these articles are relevant"
}}

Be strict - only include articles that truly help answer the user's question. If no articles are relevant, return an empty list.
"""

        print(f"🤖 [RelevanceFilter] Prompt length: {len(relevance_prompt)} characters")
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": relevance_prompt}],
            temperature=0.1,
            max_tokens=500,
        )

        response_text = response.choices[0].message.content.strip()
        print(f"🤖 [RelevanceFilter] OpenAI response: {response_text}")

        try:
            result = json.loads(response_text)
            relevant_indices = result.get("relevant_article_indices", [])
            reasoning = result.get("reasoning", "No reasoning provided")
            
            print(f"🎯 [RelevanceFilter] AI reasoning: {reasoning}")
            print(f"🎯 [RelevanceFilter] Relevant article indices: {relevant_indices}")
            
            # Filter articles based on AI recommendation
            relevant_articles = []
            for index in relevant_indices:
                if 0 <= index < len(articles):
                    relevant_articles.append(articles[index])
                    print(f"✅ [RelevanceFilter] Including article {index}: '{articles[index].get('title', 'No title')[:40]}...'")
                else:
                    print(f"⚠️  [RelevanceFilter] Invalid article index {index} (out of range)")
            
            return relevant_articles

        except json.JSONDecodeError as e:
            print(f"❌ [RelevanceFilter] JSON parsing failed: {e}")
            print(f"🔄 [RelevanceFilter] Falling back to simple keyword matching...")
            return self._fallback_relevance_filter(articles, original_question)

    def _fallback_relevance_filter(self, articles: List[Dict], original_question: str) -> List[Dict]:
        """Simple fallback relevance filter using keyword matching"""
        print(f"🔄 [RelevanceFilter] Using fallback keyword matching...")
        
        question_words = original_question.lower().split()
        question_keywords = [word for word in question_words if len(word) > 3 and word not in ['what', 'when', 'where', 'how', 'the', 'and', 'or', 'but']]
        
        print(f"🔍 [RelevanceFilter] Question keywords: {question_keywords}")
        
        relevant_articles = []
        for article in articles:
            title = article.get("title", "").lower()
            content = article.get("content", "").lower()
            description = article.get("description", "").lower()
            
            matches = 0
            for keyword in question_keywords:
                if keyword in title or keyword in content or keyword in description:
                    matches += 1
            
            # Require at least 1 keyword match
            if matches > 0:
                relevant_articles.append(article)
                print(f"✅ [RelevanceFilter] Fallback: Including '{article.get('title', 'No title')[:40]}...' ({matches} matches)")
            else:
                print(f"❌ [RelevanceFilter] Fallback: Excluding '{article.get('title', 'No title')[:40]}...' (0 matches)")
        
        return relevant_articles