from typing import Dict, List
import json

from openai import AsyncOpenAI

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import OPENAI_API_KEY


class EditorAgent(BaseAgent):
    def __init__(self):
        super().__init__("EditorAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            data = input_data.data
            raw_summary = data.get("summary", "")
            original_articles = data.get("articles", [])
            original_question = data.get("original_question", "")
            
            print(f"✏️  [Editor] Input received:")
            print(f"   📝 Raw summary length: {len(raw_summary)} characters")
            print(f"   📄 Original articles: {len(original_articles)}")
            print(f"   ❓ Original question: '{original_question}'")
            
            if not raw_summary:
                print("❌ [Editor] ERROR: No summary provided")
                return self.create_output(
                    data={"edited_summary": "", "article_citations": []}, 
                    success=False, 
                    error_message="No summary provided for editing"
                )

            print(f"✏️  [Editor] Starting comprehensive text editing...")
            
            editing_result = await self._edit_summary(raw_summary, original_articles, original_question)
            
            print(f"✅ [Editor] Editing completed:")
            print(f"   📝 Edited summary length: {len(editing_result['edited_summary'])}")
            print(f"   📎 Citations extracted: {len(editing_result['article_citations'])}")

            return self.create_output(
                data=editing_result,
                metadata={
                    "original_question": original_question,
                    "original_summary_length": len(raw_summary),
                    "edited_summary_length": len(editing_result["edited_summary"]),
                    "citations_count": len(editing_result["article_citations"]),
                    "editing_method": "ai_comprehensive_editing"
                },
            )

        except Exception as e:
            print(f"❌ [Editor] ERROR: {str(e)}")
            self.log_error(f"Error in text editing: {str(e)}")
            return self.create_output(
                data={"edited_summary": "", "article_citations": []}, 
                success=False, 
                error_message=f"Failed to edit summary: {str(e)}"
            )

    async def _edit_summary(self, raw_summary: str, original_articles: List[Dict], original_question: str) -> Dict:
        """Use AI to comprehensively edit and clean the summary"""
        
        # Prepare article information for context
        article_info = []
        for i, article in enumerate(original_articles):
            article_info.append({
                "index": i,
                "title": article.get("title", ""),
                "source": article.get("source", ""),
                "url": article.get("url", ""),
                "published_at": article.get("published_at", "")
            })
        
        print(f"🤖 [Editor] Sending summary and {len(article_info)} articles to OpenAI for comprehensive editing...")
        
        editing_prompt = f"""
You are an expert news editor. Your task is to edit and improve a news summary to make it clear, well-organized, and directly relevant to the user's question.

Original User Question: "{original_question}"

Raw Summary to Edit:
{raw_summary}

Source Articles Information:
{json.dumps(article_info, indent=2)}

Please perform the following editing tasks:

1. **Content Relevance**: Ensure all information directly answers the user's question
2. **Remove In-Text Citations**: Remove phrases like "according to Reuters", "BBC reported", "Article 1 states", etc.
3. **Remove Article References**: Remove references to "Article 1", "Article 2", numbered references, etc.
4. **Improve Organization**: Organize information logically with clear flow
5. **Fix Grammar & Style**: Ensure professional, clear writing
6. **Maintain Accuracy**: Keep all factual information intact
7. **Extract Citations**: Identify which articles were referenced for citation purposes

Respond with this exact JSON format:
{{
    "edited_summary": "The cleaned and improved summary text here",
    "article_citations": [
        {{
            "source_name": "Reuters",
            "article_url": "https://...",
            "article_title": "Article title"
        }}
    ],
    "editing_notes": "Brief explanation of main improvements made"
}}

Make the edited summary flow naturally without any in-text citations or article references, while maintaining all important facts.
"""

        print(f"🤖 [Editor] Prompt length: {len(editing_prompt)} characters")
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": editing_prompt}],
            temperature=0.2,
            max_tokens=1000,
        )

        response_text = response.choices[0].message.content.strip()
        print(f"🤖 [Editor] OpenAI response: {response_text[:200]}...")

        try:
            result = json.loads(response_text)
            edited_summary = result.get("edited_summary", "")
            article_citations = result.get("article_citations", [])
            editing_notes = result.get("editing_notes", "")
            
            print(f"✅ [Editor] JSON parsed successfully")
            print(f"✏️  [Editor] Editing notes: {editing_notes}")
            
            # Normalize United States references in edited summary
            edited_summary = self._normalize_country_names(edited_summary)
            
            return {
                "edited_summary": edited_summary,
                "article_citations": article_citations,
                "editing_notes": editing_notes
            }

        except json.JSONDecodeError as e:
            print(f"❌ [Editor] JSON parsing failed: {e}")
            print(f"🔄 [Editor] Falling back to basic text cleaning...")
            return self._fallback_editing(raw_summary, original_articles)

    def _fallback_editing(self, raw_summary: str, original_articles: List[Dict]) -> Dict:
        """Simple fallback editing using regex patterns"""
        print(f"🔄 [Editor] Using fallback editing with regex patterns...")
        
        import re
        
        edited_summary = raw_summary
        
        # Remove common in-text citation patterns
        citation_patterns = [
            r'according to [A-Za-z\s]+,?\s*',
            r'[A-Za-z\s]+ reported that\s*',
            r'[A-Za-z\s]+ stated that\s*',
            r'Article \d+ (?:states|mentions|reports) that\s*',
            r'Article \d+:?\s*',
            r'\([A-Za-z\s]+\)\s*',
            r'as reported by [A-Za-z\s]+,?\s*'
        ]
        
        for pattern in citation_patterns:
            edited_summary = re.sub(pattern, '', edited_summary, flags=re.IGNORECASE)
        
        # Clean up spacing and punctuation
        edited_summary = re.sub(r'\s+', ' ', edited_summary)
        edited_summary = re.sub(r'\s+([.,;:])', r'\1', edited_summary)
        edited_summary = edited_summary.strip()
        
        # Normalize country names
        edited_summary = self._normalize_country_names(edited_summary)
        
        # Extract basic citations from articles
        article_citations = []
        for article in original_articles:
            if article.get("source") and article.get("url"):
                article_citations.append({
                    "source_name": article.get("source"),
                    "article_url": article.get("url"),
                    "article_title": article.get("title", "")
                })
        
        print(f"✅ [Editor] Fallback editing completed")
        
        return {
            "edited_summary": edited_summary,
            "article_citations": article_citations,
            "editing_notes": "Used fallback regex-based cleaning"
        }

    def _normalize_country_names(self, text: str) -> str:
        """Normalize country name references, especially United States variations"""
        import re
        
        # Normalize United States references
        patterns = [
            (r'\b(USA|US|the US|U\.S\.A\.|U\.S\.)\b', 'United States'),
            (r'\bthe United States\b', 'United States'),  # Remove redundant "the"
        ]
        
        normalized = text
        for pattern, replacement in patterns:
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
        
        return normalized