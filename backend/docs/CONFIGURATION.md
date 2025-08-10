# Agent Chain Configuration

This document explains how to configure the news analysis agent chain system.

## Configuration File

The system uses a `.config` file located in the `backend/` directory to store sensitive API keys and configuration settings.

### File Location
```
backend/.config
```

### Security Note
- The `.config` file is automatically ignored by Git (listed in `.gitignore`)
- Never commit API keys to version control
- Keep your API keys secure and private

## Configuration Format

The `.config` file uses a simple key-value format:

```ini
# Comments start with #
# API Keys
NEWSAPI_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_key_here

# News sources are listed as domain names (one per line)
reuters.com
bbc.com
cnn.com
```

## Required API Keys

### NewsAPI Key
- **Purpose**: Fetches current news articles from reputable sources
- **Get your key**: [https://newsapi.org/register](https://newsapi.org/register)
- **Free tier**: 1,000 requests per month
- **Format**: `NEWSAPI_API_KEY=your_key_here`

### OpenAI API Key  
- **Purpose**: Powers the AI agents for text analysis and summarization
- **Get your key**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Usage**: Pay-per-use pricing
- **Format**: `OPENAI_API_KEY=sk-proj-your_key_here`

## News Sources Configuration

The system includes 46+ reputable news sources by default:

### International News Agencies
- Reuters (reuters.com)
- Associated Press (apnews.com)
- Agence France-Presse (afp.com)

### Major Broadcasters
- BBC (bbc.com, bbc.co.uk)
- CNN (cnn.com)
- NPR (npr.org)
- Deutsche Welle (dw.com)
- France 24 (france24.com)
- Al Jazeera (aljazeera.com)

### Major Publications
- The New York Times (nytimes.com)
- The Washington Post (washingtonpost.com)
- The Wall Street Journal (wsj.com)
- The Guardian (theguardian.com)
- Bloomberg (bloomberg.com)

### And many more...

## Configuration Loading

The system loads configuration in this priority order:

1. **Config file** (`.config`) - highest priority
2. **Environment variables** - fallback
3. **Default values** - last resort

## Testing Configuration

Run the configuration test to verify your setup:

```bash
cd backend
python test_config.py
```

This will show:
- ✅ API key status (configured/missing)
- 📡 Number of news sources loaded
- 🔍 Configuration file status
- 📋 Sample of loaded sources

## Usage in Code

The configuration is automatically loaded when agents are imported:

```python
from agents.config import NEWSAPI_API_KEY, OPENAI_API_KEY, REPUTABLE_SOURCES

# Configuration is ready to use
print(f"Loaded {len(REPUTABLE_SOURCES)} news sources")
```

## Troubleshooting

### "API key not configured" errors
1. Check that `.config` file exists in `backend/` directory
2. Verify API keys are correctly formatted
3. Restart the server after configuration changes
4. Run `python test_config.py` to diagnose issues

### "No news sources" errors
1. Ensure news sources are listed as domain names
2. One source per line in the `.config` file
3. Check that sources follow the format: `domain.com`

### Configuration not loading
1. Restart the FastAPI server
2. Check file permissions on `.config`
3. Verify file encoding is UTF-8

## Sample .config File

```ini
# Agent Chain Configuration
NEWSAPI_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=sk-proj-your_openai_key_here

# Reputable News Sources
reuters.com
bbc.com
cnn.com
nytimes.com
washingtonpost.com
```

## Adding New Sources

To add new reputable news sources:

1. Edit the `.config` file
2. Add the domain name on a new line
3. Restart the server
4. Test with `python test_config.py`

## Environment Variables (Alternative)

If you prefer using environment variables instead of the config file:

```bash
export NEWSAPI_API_KEY=your_key
export OPENAI_API_KEY=your_key
python main.py
```