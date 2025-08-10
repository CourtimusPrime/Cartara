from datetime import datetime, timedelta
from typing import Dict, List

import aiohttp

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import NEWSAPI_API_KEY, REPUTABLE_SOURCES


class ResearcherAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResearcherAgent")
        self.base_url = "https://newsapi.org/v2/everything"

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            keywords = input_data.data
            print(f"📰 [Researcher] Input received - Keywords: {keywords}")
            print(f"📰 [Researcher] Keywords type: {type(keywords)}, Length: {len(keywords) if keywords else 0}")
            
            if not keywords:
                print("❌ [Researcher] ERROR: No keywords provided")
                return self.create_output(
                    data=[], success=False, error_message="No keywords provided for research"
                )

            print(f"📰 [Researcher] Starting article research for {len(keywords)} keywords")
            self.log_info(f"Researching articles for keywords: {keywords}")

            articles = await self._fetch_articles(keywords)

            if not articles:
                print("⚠️  [Researcher] WARNING: No articles found from reputable sources")
                self.log_info("No articles found from reputable sources")
                return self.create_output(
                    data=[], metadata={"keywords": keywords, "sources_searched": REPUTABLE_SOURCES}
                )

            print(f"✅ [Researcher] Found {len(articles)} articles from reputable sources")
            print(f"📰 [Researcher] Article sources: {[article.get('source', 'Unknown') for article in articles]}")
            self.log_info(f"Found {len(articles)} articles from reputable sources")

            return self.create_output(
                data=articles,
                metadata={
                    "keywords": keywords,
                    "sources_searched": REPUTABLE_SOURCES,
                    "articles_count": len(articles),
                },
            )

        except Exception as e:
            self.log_error(f"Error in research: {str(e)}")
            return self.create_output(
                data=[], success=False, error_message=f"Failed to research articles: {str(e)}"
            )

    async def _fetch_articles(self, keywords: List[str]) -> List[Dict]:
        if not NEWSAPI_API_KEY:
            raise ValueError("NEWSAPI_API_KEY not configured")

        # Create a more specific query - prioritize country names and specific terms
        country_keywords = []
        other_keywords = []
        
        # Common country/region names that should be treated as primary
        priority_locations = [
            'afghanistan', 'ukraine', 'russia', 'china', 'israel', 'palestine', 
            'iran', 'north korea', 'south korea', 'germany', 'france', 'uk', 
            'united kingdom', 'united states', 'usa', 'america', 'india', 'pakistan',
            'taiwan', 'philippines', 'japan', 'australia', 'canada', 'brazil',
            'mexico', 'turkey', 'saudi arabia', 'egypt', 'south africa', 'nigeria',
            'vietnam', 'thailand', 'indonesia', 'malaysia', 'singapore', 'myanmar',
            'bangladesh', 'nepal', 'sri lanka', 'georgia', 'armenia', 'azerbaijan'
        ]
        
        for keyword in keywords:
            if any(location in keyword.lower() for location in priority_locations):
                country_keywords.append(keyword)
            else:
                other_keywords.append(keyword)
        
        print(f"🎯 [Researcher] Query analysis:")
        print(f"   🏳️ Country/location keywords: {country_keywords}")
        print(f"   🔍 Other keywords: {other_keywords}")
        
        # Build a more targeted query
        if country_keywords:
            # If we have country keywords, make them required and others optional
            required_parts = [f'"{kw}"' if ' ' in kw else kw for kw in country_keywords]
            optional_parts = other_keywords[:2]  # Limit to 2 most relevant other keywords
            
            if optional_parts:
                query = f"({' AND '.join(required_parts)}) AND ({' OR '.join(optional_parts)})"
            else:
                query = ' AND '.join(required_parts)
        else:
            # If no country keywords, use more restrictive OR logic with quotes for phrases
            formatted_keywords = [f'"{kw}"' if ' ' in kw else kw for kw in keywords[:3]]  # Limit to 3 keywords
            query = ' OR '.join(formatted_keywords)
        
        print(f"🎯 [Researcher] Constructed query: {query}")
        domains = ",".join(REPUTABLE_SOURCES)

        # Search for articles from two days ago to yesterday
        from_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        to_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

        params = {
            "q": query,
            "domains": domains,
            "from": from_date,
            "to": to_date,
            "sortBy": "relevancy",
            "pageSize": 3,
            "apiKey": NEWSAPI_API_KEY,
            "language": "en",
        }
        
        print(f"🌐 [Researcher] NewsAPI request params:")
        print(f"   📝 Query: {query}")
        print(f"   🏢 Domains: {len(REPUTABLE_SOURCES)} sources")
        print(f"   📅 Date range: {from_date} to {to_date}")
        print(f"   🔢 Page size: {params['pageSize']}")
        print(f"   🌍 Language: {params['language']}")
        print(f"   🎯 Sort by: {params['sortBy']}")

        async with aiohttp.ClientSession() as session:
            print(f"🔗 [Researcher] Making request to NewsAPI...")
            async with session.get(self.base_url, params=params) as response:
                print(f"📡 [Researcher] NewsAPI response status: {response.status}")
                
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ [Researcher] NewsAPI error: {error_text}")
                    raise ValueError(f"NewsAPI error {response.status}: {error_text}")

                data = await response.json()
                print(f"📊 [Researcher] NewsAPI response - Status: {data.get('status')}, Total results: {data.get('totalResults', 0)}")

                if data["status"] != "ok":
                    print(f"❌ [Researcher] NewsAPI returned error: {data.get('message', 'Unknown error')}")
                    raise ValueError(
                        f"NewsAPI returned error: {data.get('message', 'Unknown error')}"
                    )

                raw_articles = data.get("articles", [])
                print(f"📰 [Researcher] Processing {len(raw_articles)} raw articles")
                
                articles = []
                for i, article in enumerate(raw_articles):
                    print(f"📄 [Researcher] Article {i+1}: '{article.get('title', 'No title')[:50]}...' from {article.get('source', {}).get('name', 'Unknown')}")
                    
                    if article.get("content") and article.get("title"):
                        processed_article = {
                            "title": article["title"],
                            "content": article["content"],
                            "url": article["url"],
                            "source": article["source"]["name"],
                            "published_at": article["publishedAt"],
                            "description": article.get("description", ""),
                        }
                        articles.append(processed_article)
                        print(f"✅ [Researcher] Article {i+1} processed and added")
                    else:
                        print(f"⚠️  [Researcher] Article {i+1} skipped - missing content or title")

                print(f"✅ [Researcher] Final article count: {len(articles)}")
                print(f"📰 [Researcher] Articles will be filtered for relevance by AI in next step")
                return articles

