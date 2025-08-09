import os
from typing import List
from .config_loader import config

# Load from config file first, then fall back to environment variables
NEWSAPI_API_KEY = config.get_newsapi_key() or os.getenv("NEWSAPI_API_KEY")
OPENAI_API_KEY = config.get_config_value("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")

# Load reputable sources from config file
REPUTABLE_SOURCES = config.get_news_sources()

# Fallback sources if config file doesn't have any
if not REPUTABLE_SOURCES:
    REPUTABLE_SOURCES = [
        "reuters.com",
        "apnews.com",
        "bbc.com",
        "cnn.com",
        "npr.org",
        "wsj.com",
        "nytimes.com",
        "washingtonpost.com",
        "theguardian.com",
        "abcnews.go.com",
        "cbsnews.com",
        "nbcnews.com",
        "politico.com",
        "axios.com",
        "bloomberg.com"
    ]

MAX_ARTICLES = 5

# Print configuration status on import
print(f"🔧 Agent Configuration Loaded:")
print(f"   📰 NewsAPI Key: {'✅ Configured' if NEWSAPI_API_KEY else '❌ Missing'}")
print(f"   🤖 OpenAI Key: {'✅ Configured' if OPENAI_API_KEY else '❌ Missing'}")
print(f"   📡 News Sources: {len(REPUTABLE_SOURCES)} sources loaded")
print(f"   📊 Max Articles: {MAX_ARTICLES}")