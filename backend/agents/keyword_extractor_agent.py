import re
from typing import Dict, List, Tuple
from openai import AsyncOpenAI
from .base_agent import BaseAgent, AgentInput, AgentOutput
from .config import OPENAI_API_KEY

class KeywordExtractorAgent(BaseAgent):
    def __init__(self):
        super().__init__("KeywordExtractorAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    
    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            summary_text = input_data.data
            if not summary_text or not summary_text.strip():
                return self.create_output(
                    data={"country_1": "", "country_2": "", "relationship": ""},
                    success=False,
                    error_message="No summary text provided for keyword extraction"
                )
            
            self.log_info("Extracting countries and relationship from summary")
            
            extraction_result = await self._extract_countries_and_relationship(summary_text)
            
            self.log_info(f"Extracted: {extraction_result}")
            
            return self.create_output(
                data=extraction_result,
                metadata={
                    "summary_length": len(summary_text),
                    "extraction_method": "llm_analysis"
                }
            )
            
        except Exception as e:
            self.log_error(f"Error in keyword extraction: {str(e)}")
            return self.create_output(
                data={"country_1": "", "country_2": "", "relationship": ""},
                success=False,
                error_message=f"Failed to extract keywords: {str(e)}"
            )
    
    async def _extract_countries_and_relationship(self, summary_text: str) -> Dict[str, str]:
        extraction_prompt = f"""
Analyze the following news summary and extract:
1. The TWO main countries mentioned (if only one country is prominent, leave country_2 empty)
2. The type of relationship or interaction between them

Summary:
{summary_text}

Please respond in this exact JSON format:
{{
    "country_1": "primary country name",
    "country_2": "secondary country name or empty if not applicable", 
    "relationship": "brief description of relationship (e.g., 'war', 'diplomatic talks', 'trade dispute', 'alliance', 'conflict')"
}}

Focus on the most significant countries and their primary relationship. If there's only one main country involved, leave country_2 empty and describe the relationship as "domestic issues" or similar."""
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.1,
            max_tokens=200
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON response
        try:
            import json
            result = json.loads(response_text)
            
            # Validate and clean the response
            country_1 = result.get("country_1", "").strip()
            country_2 = result.get("country_2", "").strip()
            relationship = result.get("relationship", "").strip()
            
            return {
                "country_1": country_1,
                "country_2": country_2 if country_2 else "",
                "relationship": relationship
            }
            
        except json.JSONDecodeError:
            # Fallback: try to extract using regex patterns
            self.log_info("JSON parsing failed, using fallback extraction")
            return self._fallback_extraction(response_text)
    
    def _fallback_extraction(self, text: str) -> Dict[str, str]:
        # Simple fallback extraction using patterns
        countries = []
        
        # Common country patterns
        country_patterns = [
            r'\b(United States|USA|America)\b',
            r'\b(Russia|Russian Federation)\b',
            r'\b(China|People\'s Republic of China)\b',
            r'\b(Ukraine|Ukrainian)\b',
            r'\b(Israel|Israeli)\b',
            r'\b(Palestine|Palestinian)\b',
            r'\b(Iran|Iranian)\b',
            r'\b(North Korea|DPRK)\b',
            r'\b(South Korea|Republic of Korea)\b',
            r'\b(United Kingdom|UK|Britain)\b',
            r'\b(France|French)\b',
            r'\b(Germany|German)\b',
            r'\b(Japan|Japanese)\b',
            r'\b(India|Indian)\b',
            r'\b(Pakistan|Pakistani)\b',
            r'\b(Turkey|Turkish)\b',
            r'\b(Saudi Arabia|Saudi)\b'
        ]
        
        for pattern in country_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                countries.extend(matches)
        
        # Remove duplicates while preserving order
        unique_countries = []
        for country in countries:
            if country not in unique_countries:
                unique_countries.append(country)
        
        # Relationship keywords
        relationship_keywords = ["war", "conflict", "dispute", "negotiations", "talks", "alliance", "trade", "sanctions", "diplomatic"]
        relationship = "international relations"
        
        for keyword in relationship_keywords:
            if keyword in text.lower():
                relationship = keyword
                break
        
        return {
            "country_1": unique_countries[0] if unique_countries else "",
            "country_2": unique_countries[1] if len(unique_countries) > 1 else "",
            "relationship": relationship
        }