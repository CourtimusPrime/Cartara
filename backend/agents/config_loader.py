"""
Configuration loader for the agent chain system.
Reads configuration from .config file and provides it to agents.
"""

import os
from typing import List, Dict
from pathlib import Path

class ConfigLoader:
    def __init__(self, config_file_path: str = None):
        if config_file_path is None:
            # Default to .config in the backend directory
            backend_dir = Path(__file__).parent.parent
            config_file_path = backend_dir / ".config"
        
        self.config_file_path = Path(config_file_path)
        self._config_data = {}
        self._news_sources = []
        self._load_config()
    
    def _load_config(self):
        """Load configuration from the config file."""
        if not self.config_file_path.exists():
            print(f"Warning: Config file not found at {self.config_file_path}")
            return
        
        try:
            with open(self.config_file_path, 'r', encoding='utf-8') as f:
                current_section = None
                
                for line in f:
                    line = line.strip()
                    
                    # Skip empty lines and comments
                    if not line or line.startswith('#'):
                        continue
                    
                    # Check if this is a configuration key-value pair
                    if '=' in line and not line.endswith('.com') and not line.endswith('.org'):
                        key, value = line.split('=', 1)
                        self._config_data[key.strip()] = value.strip()
                    
                    # Check if this looks like a news source (domain name)
                    elif ('.' in line and 
                          (line.endswith('.com') or line.endswith('.org') or 
                           line.endswith('.co.uk') or line.endswith('.fr') or
                           line.endswith('.de') or line.endswith('.it') or
                           line.endswith('.es') or line.endswith('.jp'))):
                        self._news_sources.append(line)
            
            print(f"✅ Loaded config: {len(self._config_data)} settings, {len(self._news_sources)} news sources")
            
        except Exception as e:
            print(f"Error loading config file: {e}")
    
    def get_newsapi_key(self) -> str:
        """Get the NewsAPI key from config."""
        return self._config_data.get('NEWSAPI_API_KEY', os.getenv('NEWSAPI_API_KEY', ''))
    
    def get_news_sources(self) -> List[str]:
        """Get the list of reputable news sources."""
        return self._news_sources.copy()
    
    def get_config_value(self, key: str, default=None):
        """Get a configuration value by key."""
        return self._config_data.get(key, default)
    
    def get_all_config(self) -> Dict[str, str]:
        """Get all configuration data."""
        return self._config_data.copy()
    
    def reload_config(self):
        """Reload the configuration from file."""
        self._config_data = {}
        self._news_sources = []
        self._load_config()

# Create a global config instance
config = ConfigLoader()