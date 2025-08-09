#!/usr/bin/env python3
"""
Test script for the Agent Chain system.
This script tests the complete agent chain functionality.
"""

import asyncio
import json
import os

from dotenv import load_dotenv

from agents.agent_chain import AgentChainOrchestrator


async def test_agent_chain():
    load_dotenv()

    # Check required environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not set")
        return

    if not os.getenv("NEWSAPI_API_KEY"):
        print("WARNING: NEWSAPI_API_KEY not set - will use mock data")

    # Initialize agent chain
    orchestrator = AgentChainOrchestrator()

    # Test questions
    test_questions = [
        "What's the latest with the war in Ukraine?",
        "What's happening between China and Taiwan?",
        "Tell me about recent US-Russia relations",
    ]

    for i, question in enumerate(test_questions, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {question}")
        print(f"{'='*60}")

        try:
            result = await orchestrator.process_question(question)

            if result["success"]:
                print("✅ SUCCESS")
                data = result["data"]

                print(f"\nCountries: {data['country_1']} | {data['country_2']}")
                print(f"Relationship: {data['relationship']}")

                print(f"\nCountry 1 Paragraph:")
                print(data["country_1_paragraph"])

                print(f"\nCountry 2 Paragraph:")
                print(data["country_2_paragraph"])

                print(f"\nRelationship Paragraph:")
                print(data["relationship_paragraph"])

                print(f"\nMetadata:")
                metadata = result["metadata"]
                print(f"- Keywords: {metadata['keywords_extracted']}")
                print(f"- Articles found: {metadata['articles_found']}")
                print(f"- Sources: {metadata['sources']}")

            else:
                print("❌ FAILED")
                print(f"Error: {result['error']}")

        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")

        # Brief pause between tests
        await asyncio.sleep(1)

    print(f"\n{'='*60}")
    print("Testing completed!")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(test_agent_chain())
