#!/usr/bin/env python3
"""
Test script to verify the configuration loader is working correctly.
"""

from agents.config_loader import config
from agents.config import NEWSAPI_API_KEY, REPUTABLE_SOURCES, OPENAI_API_KEY

def test_configuration():
    print("🧪 Testing Agent Chain Configuration")
    print("=" * 50)
    
    print(f"\n📰 NewsAPI Configuration:")
    print(f"   Key from config loader: {'✅ Found' if config.get_newsapi_key() else '❌ Missing'}")
    print(f"   Key from agents.config: {'✅ Found' if NEWSAPI_API_KEY else '❌ Missing'}")
    if NEWSAPI_API_KEY:
        print(f"   Key preview: {NEWSAPI_API_KEY[:8]}...{NEWSAPI_API_KEY[-4:]}")
    
    print(f"\n🤖 OpenAI Configuration:")
    print(f"   Key status: {'✅ Found' if OPENAI_API_KEY else '❌ Missing'}")
    if OPENAI_API_KEY:
        print(f"   Key preview: {OPENAI_API_KEY[:8]}...{OPENAI_API_KEY[-4:]}")
    
    print(f"\n📡 News Sources Configuration:")
    print(f"   Total sources loaded: {len(REPUTABLE_SOURCES)}")
    print(f"   Sources from config: {len(config.get_news_sources())}")
    
    if REPUTABLE_SOURCES:
        print(f"\n   📋 Sample sources:")
        for i, source in enumerate(REPUTABLE_SOURCES[:10]):
            print(f"      {i+1:2d}. {source}")
        if len(REPUTABLE_SOURCES) > 10:
            print(f"      ... and {len(REPUTABLE_SOURCES) - 10} more")
    
    print(f"\n🔍 Configuration File Status:")
    print(f"   Config file path: {config.config_file_path}")
    print(f"   File exists: {'✅ Yes' if config.config_file_path.exists() else '❌ No'}")
    
    all_config = config.get_all_config()
    print(f"   Total config entries: {len(all_config)}")
    
    print("\n" + "=" * 50)
    print("✅ Configuration test completed!")

if __name__ == "__main__":
    test_configuration()