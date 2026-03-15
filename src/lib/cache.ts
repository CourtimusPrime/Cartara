import type { AgentChainResponse } from './agents/types';

interface CacheEntry {
  data: AgentChainResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_ENTRIES = 50;

function normalize(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function getCached(query: string): AgentChainResponse | null {
  const key = normalize(query);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(query: string, data: AgentChainResponse): void {
  // Evict oldest entries if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(normalize(query), { data, timestamp: Date.now() });
}
