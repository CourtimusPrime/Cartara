import logging
from typing import Any, Dict

from .base_agent import AgentInput
from .divider_agent import DividerAgent
from .keyword_extractor_agent import KeywordExtractorAgent
from .relevance_filter_agent import RelevanceFilterAgent
from .researcher_agent import ResearcherAgent
from .summarizer_agent import SummarizerAgent
from .transformer_agent import TransformerAgent


class AgentChainOrchestrator:
    def __init__(self):
        self.logger = logging.getLogger("AgentChainOrchestrator")

        # Initialize all agents
        self.transformer_agent = TransformerAgent()
        self.researcher_agent = ResearcherAgent()
        self.relevance_filter_agent = RelevanceFilterAgent()
        self.summarizer_agent = SummarizerAgent()
        self.keyword_extractor_agent = KeywordExtractorAgent()
        self.divider_agent = DividerAgent()

    async def process_question(self, user_question: str) -> Dict[str, Any]:
        """
        Process a user's natural language question through the complete agent chain.

        Args:
            user_question: The user's question about current events

        Returns:
            Dictionary with structured JSON output containing:
            - country_1_paragraph
            - country_2_paragraph
            - relationship_paragraph
            - metadata about processing
        """
        try:
            print(f"🚀 [Chain] ==========================================================")
            print(f"🚀 [Chain] STARTING AGENT CHAIN PROCESSING")
            print(f"🚀 [Chain] User question: '{user_question}'")
            print(f"🚀 [Chain] ==========================================================")
            
            self.logger.info(f"Starting agent chain processing for question: {user_question}")

            # Step 1: Transform question to keywords
            print(f"🔄 [Chain] STEP 1: Transforming question to keywords")
            self.logger.info("Step 1: Extracting keywords")
            transformer_input = AgentInput(data=user_question)
            transformer_output = await self.transformer_agent.process(transformer_input)

            if not transformer_output.success:
                print(f"❌ [Chain] STEP 1 FAILED: {transformer_output.error_message}")
                return self._create_error_response(
                    "Failed to extract keywords", transformer_output.error_message
                )

            keywords = transformer_output.data
            print(f"✅ [Chain] STEP 1 SUCCESS: {keywords}")
            self.logger.info(f"Extracted keywords: {keywords}")

            # Step 2: Research articles
            print(f"📰 [Chain] STEP 2: Researching articles")
            self.logger.info("Step 2: Researching articles")
            researcher_input = AgentInput(data=keywords, metadata=transformer_output.metadata)
            researcher_output = await self.researcher_agent.process(researcher_input)

            if not researcher_output.success:
                print(f"❌ [Chain] STEP 2 FAILED: {researcher_output.error_message}")
                return self._create_error_response(
                    "Failed to research articles", researcher_output.error_message
                )

            articles = researcher_output.data
            print(f"✅ [Chain] STEP 2 SUCCESS: Found {len(articles)} articles")
            self.logger.info(f"Found {len(articles)} articles")

            if not articles:
                print(f"⚠️  [Chain] STEP 2 WARNING: No articles found")
                return self._create_error_response(
                    "No relevant articles found", "No articles found from reputable sources"
                )

            # Step 3: Filter articles for relevance using AI
            print(f"🎯 [Chain] STEP 3: Filtering articles for relevance")
            self.logger.info("Step 3: Filtering articles for relevance")
            relevance_input = AgentInput(
                data={"articles": articles, "original_question": user_question},
                metadata=researcher_output.metadata
            )
            relevance_output = await self.relevance_filter_agent.process(relevance_input)

            if not relevance_output.success:
                print(f"❌ [Chain] STEP 3 FAILED: {relevance_output.error_message}")
                return self._create_error_response(
                    "Failed to filter articles for relevance", relevance_output.error_message
                )

            relevant_articles = relevance_output.data
            print(f"✅ [Chain] STEP 3 SUCCESS: Filtered {len(articles)} -> {len(relevant_articles)} relevant articles")
            
            if not relevant_articles:
                print(f"⚠️  [Chain] STEP 3 WARNING: No relevant articles after filtering")
                return self._create_error_response(
                    "No relevant articles found", "All articles were filtered out as irrelevant to the question"
                )

            # Step 4: Summarize relevant articles
            print(f"📄 [Chain] STEP 4: Summarizing relevant articles")
            self.logger.info("Step 4: Summarizing relevant articles")
            summarizer_input = AgentInput(data=relevant_articles, metadata=relevance_output.metadata)
            summarizer_output = await self.summarizer_agent.process(summarizer_input)

            if not summarizer_output.success:
                print(f"❌ [Chain] STEP 4 FAILED: {summarizer_output.error_message}")
                return self._create_error_response(
                    "Failed to summarize articles", summarizer_output.error_message
                )

            summary = summarizer_output.data
            print(f"✅ [Chain] STEP 4 SUCCESS: Created summary ({len(summary)} chars)")
            self.logger.info("Successfully created summary")

            # Step 5: Extract countries and relationship
            print(f"🔍 [Chain] STEP 5: Extracting countries and relationship")
            self.logger.info("Step 5: Extracting countries and relationship")
            extractor_input = AgentInput(data=summary, metadata=summarizer_output.metadata)
            extractor_output = await self.keyword_extractor_agent.process(extractor_input)

            if not extractor_output.success:
                print(f"❌ [Chain] STEP 5 FAILED: {extractor_output.error_message}")
                return self._create_error_response(
                    "Failed to extract countries", extractor_output.error_message
                )

            countries_data = extractor_output.data
            print(f"✅ [Chain] STEP 5 SUCCESS: Extracted countries: {countries_data}")
            self.logger.info(f"Extracted countries: {countries_data}")

            # Step 6: Create structured paragraphs
            print(f"📝 [Chain] STEP 6: Creating structured paragraphs")
            self.logger.info("Step 6: Creating structured paragraphs")
            divider_input = AgentInput(
                data={"summary": summary, "countries": countries_data},
                metadata=extractor_output.metadata,
            )
            divider_output = await self.divider_agent.process(divider_input)

            if not divider_output.success:
                print(f"❌ [Chain] STEP 6 FAILED: {divider_output.error_message}")
                return self._create_error_response(
                    "Failed to create structured output", divider_output.error_message
                )

            paragraphs = divider_output.data
            print(f"✅ [Chain] STEP 6 SUCCESS: Created paragraphs")

            # Create final structured response
            result = {
                "success": True,
                "data": {
                    "country_1": countries_data.get("country_1", ""),
                    "country_2": countries_data.get("country_2", ""),
                    "relationship": countries_data.get("relationship", ""),
                    "country_1_paragraph": paragraphs.get("country_1_paragraph", ""),
                    "country_2_paragraph": paragraphs.get("country_2_paragraph", ""),
                    "relationship_paragraph": paragraphs.get("relationship_paragraph", ""),
                    "summary": summary,
                },
                "metadata": {
                    "original_question": user_question,
                    "keywords_extracted": keywords,
                    "articles_found": len(articles),
                    "articles_filtered": len(relevant_articles),
                    "sources": [article.get("source", "Unknown") for article in relevant_articles],
                    "processing_steps_completed": 6,
                },
            }

            print(f"🎉 [Chain] ==========================================================")
            print(f"🎉 [Chain] AGENT CHAIN PROCESSING COMPLETED SUCCESSFULLY")
            print(f"🎉 [Chain] Final result data keys: {list(result['data'].keys())}")
            print(f"🎉 [Chain] Countries: {result['data']['country_1']} & {result['data']['country_2']}")
            print(f"🎉 [Chain] Relationship: {result['data']['relationship']}")
            print(f"🎉 [Chain] ==========================================================")
            
            self.logger.info("Agent chain processing completed successfully")
            return result

        except Exception as e:
            self.logger.error(f"Unexpected error in agent chain: {str(e)}")
            return self._create_error_response("Unexpected error in processing", str(e))

    def _create_error_response(self, error_type: str, error_message: str) -> Dict[str, Any]:
        """Create a standardized error response"""
        return {
            "success": False,
            "error": {"type": error_type, "message": error_message},
            "data": {
                "country_1": "",
                "country_2": "",
                "relationship": "",
                "country_1_paragraph": "",
                "country_2_paragraph": "",
                "relationship_paragraph": "",
                "summary": "",
            },
        }
