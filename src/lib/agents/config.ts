import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Fast model for simple tasks (keyword extraction, filtering)
export const fastModel = openrouter(process.env.AI_MODEL_FAST || 'google/gemini-flash-1.5');

// Quality model for complex tasks (synthesis, analysis)
export const qualityModel = openrouter(process.env.AI_MODEL_QUALITY || 'google/gemini-flash-1.5');

export const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

export const REPUTABLE_SOURCES = [
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'cnn.com',
  'npr.org',
  'wsj.com',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'abcnews.go.com',
  'cbsnews.com',
  'nbcnews.com',
  'politico.com',
  'axios.com',
  'bloomberg.com',
  'aljazeera.com',
  'france24.com',
  'dw.com',
  'cnbc.com',
  'foxnews.com',
];

export const MAX_ARTICLES = 10;
