#!/usr/bin/env python3
"""
Example usage of the Agent Chain API endpoint.
This demonstrates how to make requests to the /analyze-news endpoint.
"""

import asyncio
import aiohttp
import json

async def test_api_endpoint():
    """Test the /analyze-news API endpoint"""
    
    base_url = "http://localhost:8000"
    
    # Test questions
    test_questions = [
        "What's the latest with the war in Ukraine?",
        "What's happening between China and Taiwan?",
        "Tell me about recent US-Russia relations"
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, question in enumerate(test_questions, 1):
            print(f"\n{'='*60}")
            print(f"API Test {i}: {question}")
            print(f"{'='*60}")
            
            try:
                payload = {"question": question}
                
                async with session.post(
                    f"{base_url}/analyze-news",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        
                        if result["success"]:
                            print("✅ SUCCESS")
                            data = result["data"]
                            
                            print(f"\nStructured Output:")
                            print(f"Countries: {data['country_1']} | {data['country_2']}")
                            print(f"Relationship: {data['relationship']}")
                            
                            print(f"\nCountry 1 Developments:")
                            print(data['country_1_paragraph'])
                            
                            print(f"\nCountry 2 Developments:")
                            print(data['country_2_paragraph'])
                            
                            print(f"\nRelationship Description:")
                            print(data['relationship_paragraph'])
                            
                        else:
                            print("❌ API FAILED")
                            print(f"Error: {result['error']}")
                    else:
                        print(f"❌ HTTP ERROR: {response.status}")
                        error_text = await response.text()
                        print(f"Response: {error_text}")
                        
            except Exception as e:
                print(f"❌ EXCEPTION: {str(e)}")
            
            # Brief pause between tests
            await asyncio.sleep(1)
    
    print(f"\n{'='*60}")
    print("API Testing completed!")
    print(f"{'='*60}")

def example_json_output():
    """Show example of expected JSON output structure"""
    
    example_response = {
        "success": True,
        "data": {
            "country_1": "Ukraine",
            "country_2": "Russia", 
            "relationship": "war",
            "country_1_paragraph": "Ukraine continues to defend against Russian military operations...",
            "country_2_paragraph": "Russia has maintained its military presence in the region...",
            "relationship_paragraph": "The ongoing conflict between Ukraine and Russia represents...",
            "summary": "Recent developments in the Ukraine-Russia conflict show..."
        },
        "error": None
    }
    
    print("Example JSON Output Structure:")
    print("=" * 40)
    print(json.dumps(example_response, indent=2))

if __name__ == "__main__":
    print("Agent Chain API Usage Examples")
    print("=" * 50)
    
    print("\n1. Example JSON Output Structure:")
    example_json_output()
    
    print("\n\n2. Testing API Endpoint (requires running server):")
    print("Start the server first with: python main.py")
    print("Then run this test...")
    
    # Uncomment to test API endpoint
    # asyncio.run(test_api_endpoint())