import os
from typing import List

NEWSAPI_API_KEY = os.getenv("NEWSAPI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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