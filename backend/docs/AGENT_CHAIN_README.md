# Agent Chain System

## Overview

This implementation provides a 5-agent chain system that converts natural language questions about current events into structured JSON output. The system processes user questions through a sequential pipeline to deliver comprehensive analysis of recent developments and international relationships.

## Architecture

### Agent Flow
1. **Transformer Agent** → Extract keywords from user question
2. **Researcher Agent** → Fetch articles from reputable sources using NewsAPI
3. **Summarizer Agent** → Create coherent summary from articles
4. **Keyword Extractor Agent** → Identify countries and relationships
5. **Divider Agent** → Generate structured paragraph output

## API Usage

### Endpoint
```
POST /analyze-news
```

### Request Body
```json
{
    "question": "What's the latest with the war in Ukraine?"
}
```

### Response Format
```json
{
    "success": true,
    "data": {
        "country_1": "Ukraine",
        "country_2": "Russia",
        "relationship": "war",
        "country_1_paragraph": "Recent developments in Ukraine...",
        "country_2_paragraph": "Russia's current situation...",
        "relationship_paragraph": "The ongoing conflict between...",
        "summary": "Full summary of recent events..."
    },
    "error": null
}
```

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
NEWSAPI_API_KEY=your_newsapi_key
```

### Reputable Sources
The system is configured to only fetch articles from predefined reputable news sources:
- Reuters, AP News, BBC, CNN, NPR
- WSJ, NYTimes, Washington Post, The Guardian
- ABC News, CBS News, NBC News, Politico
- Axios, Bloomberg

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables in `.env` file

3. Run the server:
```bash
python main.py
```

## Testing

### Direct Agent Chain Test
```bash
python test_agent_chain.py
```

### API Endpoint Test
```bash
python example_usage.py
```

## Error Handling

The system includes comprehensive error handling:
- Invalid API keys
- No articles found from reputable sources  
- Article parsing failures
- LLM processing errors
- JSON parsing fallbacks

## Key Features

- **Source Validation**: Only uses predefined reputable news sources
- **Factual Accuracy**: Preserves chronological order and factual information
- **Structured Output**: Consistent JSON format for easy integration
- **Comprehensive Metadata**: Includes processing details and source attribution
- **Fallback Mechanisms**: Handles API failures gracefully
- **Rate Limiting**: Respects API limits with configurable parameters

## File Structure

```
backend/
├── agents/
│   ├── __init__.py
│   ├── base_agent.py              # Base agent class
│   ├── config.py                  # Configuration and constants
│   ├── transformer_agent.py       # Keyword extraction
│   ├── researcher_agent.py        # NewsAPI integration
│   ├── summarizer_agent.py        # Article summarization
│   ├── keyword_extractor_agent.py # Country/relationship extraction
│   ├── divider_agent.py          # Structured output generation
│   └── agent_chain.py            # Main orchestrator
├── main.py                       # FastAPI application
├── test_agent_chain.py           # Test script
└── example_usage.py              # Usage examples
```

## Limitations

- Requires valid OpenAI and NewsAPI keys
- Limited to articles from last 7 days
- Maximum 5 articles per query
- English language sources only
- Rate limited by external API quotas