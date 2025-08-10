from typing import Dict

from openai import AsyncOpenAI

from .base_agent import AgentInput, AgentOutput, BaseAgent
from .config import OPENAI_API_KEY


class DividerAgent(BaseAgent):
    def __init__(self):
        super().__init__("DividerAgent")
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        try:
            data = input_data.data
            print(f"📝 [Divider] Input received - Data type: {type(data)}")
            print(f"📝 [Divider] Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            summary_text = data.get("summary", "")
            countries_data = data.get("countries", {})
            
            print(f"📝 [Divider] Summary length: {len(summary_text)}")
            print(f"📝 [Divider] Summary preview: {summary_text[:150] if summary_text else 'None'}...")
            print(f"📝 [Divider] Countries data: {countries_data}")

            if not summary_text:
                print("❌ [Divider] ERROR: No summary text provided")
                return self.create_output(
                    data={}, success=False, error_message="No summary text provided for division"
                )

            country_1 = countries_data.get("country_1", "")
            country_2 = countries_data.get("country_2", "")
            relationship = countries_data.get("relationship", "")

            print(f"📝 [Divider] Creating paragraphs for:")
            print(f"   🏳️ Country 1: '{country_1}'")
            print(f"   🏳️ Country 2: '{country_2}'")
            print(f"   🤝 Relationship: '{relationship}'")

            self.log_info(
                f"Creating structured paragraphs for {country_1}, {country_2}, relationship: {relationship}"
            )

            divided_content = await self._create_structured_paragraphs(
                summary_text, country_1, country_2, relationship
            )

            print(f"✅ [Divider] Successfully created structured paragraphs")
            print(f"📝 [Divider] Result keys: {list(divided_content.keys()) if isinstance(divided_content, dict) else 'Not a dict'}")
            self.log_info("Successfully created structured paragraphs")

            return self.create_output(
                data=divided_content,
                metadata={
                    "country_1": country_1,
                    "country_2": country_2,
                    "relationship": relationship,
                    "summary_length": len(summary_text),
                },
            )

        except Exception as e:
            self.log_error(f"Error in content division: {str(e)}")
            return self.create_output(
                data={}, success=False, error_message=f"Failed to divide content: {str(e)}"
            )

    async def _create_structured_paragraphs(
        self, summary_text: str, country_1: str, country_2: str, relationship: str
    ) -> Dict[str, str]:
        if country_2:
            division_prompt = f"""
Based on the following news summary, create exactly three short, distinct paragraphs:

1. Paragraph about developments in {country_1}
2. Paragraph about developments in {country_2} 
3. Paragraph describing the {relationship} between {country_1} and {country_2}

Summary:
{summary_text}

Requirements:
- Each paragraph should be 2-4 sentences
- Focus on recent developments and current events
- Be factual and avoid speculation
- Keep paragraphs concise but informative

Please respond in this exact JSON format:
{{
    "country_1_paragraph": "paragraph about {country_1}",
    "country_2_paragraph": "paragraph about {country_2}",
    "relationship_paragraph": "paragraph about their {relationship}"
}}"""
        else:
            division_prompt = f"""
Based on the following news summary, create exactly three short, distinct paragraphs:

1. Paragraph about internal developments in {country_1}
2. Paragraph about {country_1}'s international relations and external factors
3. Paragraph about the broader context and implications

Summary:
{summary_text}

Requirements:
- Each paragraph should be 2-4 sentences
- Focus on recent developments and current events
- Be factual and avoid speculation
- Keep paragraphs concise but informative

Please respond in this exact JSON format:
{{
    "country_1_paragraph": "paragraph about internal developments in {country_1}",
    "country_2_paragraph": "paragraph about {country_1}'s international relations",
    "relationship_paragraph": "paragraph about broader context and implications"
}}"""

        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": division_prompt}],
            temperature=0.3,
            max_tokens=600,
        )

        response_text = response.choices[0].message.content.strip()

        try:
            import json

            result = json.loads(response_text)

            return {
                "country_1_paragraph": result.get("country_1_paragraph", "").strip(),
                "country_2_paragraph": result.get("country_2_paragraph", "").strip(),
                "relationship_paragraph": result.get("relationship_paragraph", "").strip(),
            }

        except json.JSONDecodeError:
            # Fallback: create simple paragraphs
            self.log_info("JSON parsing failed, using fallback division")
            return self._fallback_division(summary_text, country_1, country_2, relationship)

    def _fallback_division(
        self, summary_text: str, country_1: str, country_2: str, relationship: str
    ) -> Dict[str, str]:
        # Simple fallback - split summary into three roughly equal parts
        sentences = summary_text.split(". ")

        if len(sentences) >= 3:
            third = len(sentences) // 3
            para1 = ". ".join(sentences[:third]) + "."
            para2 = ". ".join(sentences[third : third * 2]) + "."
            para3 = ". ".join(sentences[third * 2 :]) + "."
        else:
            para1 = summary_text
            para2 = "Additional context regarding the situation."
            para3 = "The situation continues to develop."

        return {
            "country_1_paragraph": para1,
            "country_2_paragraph": para2,
            "relationship_paragraph": para3,
        }
