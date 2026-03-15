import { MAX_ARTICLES, SERPER_API_KEY } from './config';
import type { Article } from './types';

const COUNTRY_KEYWORDS = new Set([
  'afghanistan',
  'ukraine',
  'russia',
  'china',
  'israel',
  'palestine',
  'iran',
  'north korea',
  'south korea',
  'germany',
  'france',
  'uk',
  'united kingdom',
  'united states',
  'usa',
  'america',
  'india',
  'pakistan',
  'taiwan',
  'philippines',
  'japan',
  'australia',
  'canada',
  'brazil',
  'mexico',
  'turkey',
  'saudi arabia',
  'egypt',
  'south africa',
  'nigeria',
]);

function buildQuery(keywords: string[]): string {
  const countryKw = keywords.filter(k => COUNTRY_KEYWORDS.has(k.toLowerCase()));
  const otherKw = keywords.filter(k => !COUNTRY_KEYWORDS.has(k.toLowerCase()));

  if (countryKw.length > 0) {
    const parts = [...countryKw, ...otherKw.slice(0, 2)];
    return parts.join(' ');
  }

  return keywords.slice(0, 3).join(' ');
}

export async function fetchArticles(keywords: string[]): Promise<Article[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY is not configured');
  }

  const query = `${buildQuery(keywords)} news`;

  const response = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: MAX_ARTICLES,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const newsResults: Array<{
    title?: string;
    snippet?: string;
    link?: string;
    source?: string;
    date?: string;
  }> = data.news || [];

  return newsResults
    .filter(item => item.title && item.link)
    .map(item => ({
      title: item.title || '',
      content: item.snippet || '',
      url: item.link || '',
      source: item.source || 'Unknown',
      published_at: item.date || '',
      description: item.snippet || '',
    }));
}
