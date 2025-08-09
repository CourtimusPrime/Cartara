import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
from .base_agent import BaseAgent, AgentInput, AgentOutput
from .config import NEWSAPI_API_KEY, REPUTABLE_SOURCES, MAX_ARTICLES

class ResearcherAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResearcherAgent")
        self.base_url = "https://newsapi.org/v2/everything"
    
    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            keywords = input_data.data
            if not keywords:
                return self.create_output(
                    data=[],
                    success=False,
                    error_message="No keywords provided for research"
                )
            
            self.log_info(f"Researching articles for keywords: {keywords}")
            
            articles = await self._fetch_articles(keywords)
            
            if not articles:
                self.log_info("No articles found from reputable sources")
                return self.create_output(
                    data=[],
                    metadata={"keywords": keywords, "sources_searched": REPUTABLE_SOURCES}
                )
            
            self.log_info(f"Found {len(articles)} articles from reputable sources")
            
            return self.create_output(
                data=articles,
                metadata={
                    "keywords": keywords,
                    "sources_searched": REPUTABLE_SOURCES,
                    "articles_count": len(articles)
                }
            )
            
        except Exception as e:
            self.log_error(f"Error in research: {str(e)}")
            return self.create_output(
                data=[],
                success=False,
                error_message=f"Failed to research articles: {str(e)}"
            )
    
    async def _fetch_articles(self, keywords: List[str]) -> List[Dict]:
        if not NEWSAPI_API_KEY:
            raise ValueError("NEWSAPI_API_KEY not configured")
        
        query = " OR ".join(keywords)
        domains = ",".join(REPUTABLE_SOURCES)
        
        # Search for articles from the last 7 days
        from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        params = {
            'q': query,
            'domains': domains,
            'from': from_date,
            'sortBy': 'relevancy',
            'pageSize': MAX_ARTICLES,
            'apiKey': NEWSAPI_API_KEY,
            'language': 'en'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"NewsAPI error {response.status}: {error_text}")
                
                data = await response.json()
                
                if data['status'] != 'ok':
                    raise ValueError(f"NewsAPI returned error: {data.get('message', 'Unknown error')}")
                
                articles = []
                for article in data.get('articles', []):
                    if article.get('content') and article.get('title'):
                        articles.append({
                            'title': article['title'],
                            'content': article['content'],
                            'url': article['url'],
                            'source': article['source']['name'],
                            'published_at': article['publishedAt'],
                            'description': article.get('description', '')
                        })
                
                return articles[:MAX_ARTICLES]