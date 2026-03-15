# Cartara - Production PRD

## Executive Summary

**Cartara** is a geopolitical intelligence visualization tool that transforms natural language questions about world events into AI-analyzed, source-cited summaries displayed on an interactive 3D globe. Users ask questions like "What's happening between China and Taiwan?" and receive structured analysis with cited news sources, visualized as color-coded relationship arcs between countries on a globe.

### Current State (MVP)

- Working end-to-end pipeline: user question → 7-agent AI chain → globe visualization
- Polished UI with streaming text, animated transitions, and citation badges
- **Split architecture**: Next.js 15 frontend + Python FastAPI backend (separate processes)
- Uses GPT-3.5-turbo via OpenAI SDK + NewsAPI for article fetching
- No deployment infrastructure, no tests, no security hardening
- Limited to exactly 2 countries per analysis

### Target State (Production)

- **Unified full-stack TypeScript** application (Next.js API routes, no Python backend)
- AI via **OpenRouter** (flexible, cost-optimized model selection)
- News data via **Serper.dev** or OpenRouter web search (replacing NewsAPI)
- Optimized agent chain (4-5 steps instead of 7)
- Deployed on **Railway** as a single service
- Production-hardened with proper error handling, rate limiting, and input validation
- No user accounts - stateless public tool (portfolio showcase)

---

## 1. Architecture Migration (P0 - Critical)

The most impactful change: eliminate the Python backend entirely and consolidate into a single Next.js application.

### 1.1 Backend Rewrite: Python FastAPI → Next.js API Routes

**Why**: Running two separate services (Next.js on :3000, FastAPI on :8000) adds deployment complexity, CORS issues, and operational overhead. A unified TypeScript app deploys as one service on Railway.

**What to do**:

| Current (Python)                        | Target (TypeScript)                          |
| --------------------------------------- | -------------------------------------------- |
| `backend/main.py` (FastAPI)             | `src/app/api/analyze/route.ts` (Route Handler) |
| `backend/agents/*.py` (7 agent files)   | `src/lib/agents/*.ts` (4-5 agent files)      |
| `openai` Python SDK                     | `ai` (Vercel AI SDK) + OpenRouter provider   |
| `aiohttp` + NewsAPI                     | `fetch` + Serper.dev (or OpenRouter web search) |
| `POST /analyze-news` on localhost:8000  | `POST /api/analyze` (same origin)            |
| WebSocket `/ws` + `/chat` endpoints     | Remove (unnecessary complexity)              |
| `GET /health`                           | `GET /api/health`                            |

**Steps**:

1. Install Vercel AI SDK: `npm install ai @ai-sdk/openai` (OpenRouter is OpenAI-compatible)
2. Create `src/lib/agents/` directory with TypeScript agent modules
3. Create `src/app/api/analyze/route.ts` as the main API endpoint
4. Update `src/components/PromptInterface.tsx` line 246: change `http://localhost:8000/analyze-news` → `/api/analyze`
5. Update `src/hooks/useTooltipData.ts` line 42: same URL change
6. Delete entire `backend/` directory
7. Remove `streamlit`, `streamlit-chat`, `asyncio-mqtt`, `requests` from any references

### 1.2 Agent Chain Migration

Port each Python agent to TypeScript. Modern models handle more complex prompts, so consolidate where possible:

| Current Python Agent                | Target TypeScript Module            | Notes                                    |
| ----------------------------------- | ----------------------------------- | ---------------------------------------- |
| `transformer_agent.py`              | `src/lib/agents/transformer.ts`     | Extract keywords from question           |
| `researcher_agent.py`               | `src/lib/agents/researcher.ts`      | Fetch news via Serper.dev / web search   |
| `relevance_filter_agent.py`         | `src/lib/agents/relevance-filter.ts`| Filter articles for relevance            |
| `summarizer_agent.py` + `editor_agent.py` | `src/lib/agents/synthesizer.ts` | **Combine** into one: summarize + edit + cite |
| `keyword_extractor_agent.py` + `divider_agent.py` | `src/lib/agents/analyzer.ts` | **Combine** into one: extract countries + structure paragraphs |
| `agent_chain.py`                    | `src/lib/agents/chain.ts`           | Orchestrator                             |
| `base_agent.py`                     | `src/lib/agents/types.ts`           | Shared types and interfaces              |

**Key implementation details**:

- Use `generateObject()` from Vercel AI SDK with **Zod schemas** for structured output. This replaces all the fragile JSON parsing and regex fallbacks in the current Python agents (e.g., `relevance_filter_agent.py` has a fallback keyword matcher when JSON parsing fails)
- Use `streamText()` for the final summary streaming to the frontend
- Run independent steps in parallel where possible (e.g., after articles are fetched, keyword extraction and summarization can run concurrently)

### 1.3 OpenRouter Integration

```typescript
// src/lib/agents/config.ts
import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model is configurable - pick based on cost/quality tradeoff
export const model = openrouter(process.env.AI_MODEL || 'google/gemini-flash-1.5');
```

### 1.4 API Route Design

```
POST /api/analyze    → Main analysis endpoint (replaces /analyze-news)
GET  /api/health     → Health check for Railway monitoring
```

Remove the WebSocket `/ws` and HTTP `/chat` endpoints - they're vestiges of the old Streamlit UI and add unnecessary complexity.

### 1.5 Frontend URL Updates

**Files to update**:

- `src/components/PromptInterface.tsx` line 246: `'http://localhost:8000/analyze-news'` → `'/api/analyze'`
- `src/hooks/useTooltipData.ts` line 42: same change
- Request body: `{ question: prompt }` stays the same (or rename to match new API)

---

## 2. AI & Agent Improvements (P0)

### 2.1 Model Selection

Switch from GPT-3.5-turbo to a cost-effective model via OpenRouter. Recommended candidates:

| Model                 | Cost (input/output per 1M tokens) | Speed   | Quality | Best For              |
| --------------------- | --------------------------------- | ------- | ------- | --------------------- |
| `google/gemini-flash-1.5` | $0.075 / $0.30                | Fast    | Good    | Default choice        |
| `openai/gpt-4o-mini`  | $0.15 / $0.60                     | Fast    | Better  | Higher quality        |
| `anthropic/claude-haiku` | $0.25 / $1.25                  | Fast    | Better  | Complex reasoning     |
| `meta-llama/llama-3.1-8b` | $0.05 / $0.05                | Fastest | OK      | Keyword extraction    |

**Recommendation**: Use a cheap/fast model (Gemini Flash or Llama 3.1) for simple steps (keyword extraction, relevance filtering) and a higher-quality model (GPT-4o-mini or Haiku) for synthesis/analysis steps. Make model configurable via environment variables.

### 2.2 Agent Chain Optimization

**Current chain**: 7 sequential agents, 7 LLM calls → 7-9 second response time

**Optimized chain**: 4-5 agents, some in parallel → target 4-6 second response time

```
User Question
    │
    ▼
┌─────────────────────┐
│ 1. TRANSFORMER      │  Extract 3-5 search keywords
│    (fast model)      │  Same as current, uses generateObject() + Zod
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 2. RESEARCHER       │  Fetch articles via Serper.dev or web search
│    (no LLM needed)   │  HTTP call, not an LLM step
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 3. RELEVANCE FILTER │  AI filters articles for relevance
│    (fast model)      │  Uses generateObject() with Zod array schema
└─────────┬───────────┘
          │
          ├──────────────────────────┐
          ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐
│ 4a. SYNTHESIZER     │  │ 4b. ANALYZER        │  ← RUN IN PARALLEL
│ (quality model)      │  │ (fast model)         │
│ Summarize + edit +  │  │ Extract countries +  │
│ extract citations   │  │ determine relationship│
└─────────┬───────────┘  └─────────┬───────────┘
          │                        │
          └────────┬───────────────┘
                   ▼
         ┌─────────────────────┐
         │ 5. STRUCTURER       │  Create 3 focused paragraphs
         │ (quality model)      │  (country1, country2, relationship)
         └─────────────────────┘
                   │
                   ▼
            Final Response
```

### 2.3 Structured Outputs with Zod

Replace all fragile JSON parsing with Vercel AI SDK's `generateObject()`:

```typescript
// Example: Relevance filter with Zod schema
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: fastModel,
  schema: z.object({
    relevant_indices: z.array(z.number()).describe('Indices of relevant articles'),
  }),
  prompt: `Given these articles and the question "${question}", which articles are relevant?`,
});
```

This eliminates the regex fallbacks and JSON.parse error handling that clutter the current Python agents.

### 2.4 Web Search Integration

**Option A: Serper.dev** (Recommended)
- Google Search API, $50/mo for 20K searches (free tier: 2,500 searches)
- Returns structured results with titles, snippets, URLs
- Simple REST API, easy to integrate

**Option B: OpenRouter Web Search**
- Some OpenRouter models support web search natively
- No additional API key needed
- Less control over sources

**Option C: Keep NewsAPI**
- Free tier: 100 requests/day (too low for production)
- Paid: $449/mo (expensive for portfolio project)
- Limited to specific news sources

**Recommendation**: Start with Serper.dev (best price/control ratio). Fall back to OpenRouter web search if the chosen model supports it.

### 2.5 Response Caching

Add an in-memory LRU cache for repeated/similar queries. No Redis needed for a portfolio project.

```typescript
// src/lib/cache.ts
const cache = new Map<string, { data: AnalysisResult; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export function getCached(query: string): AnalysisResult | null {
  const normalized = query.toLowerCase().trim();
  const entry = cache.get(normalized);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}
```

### 2.6 Streaming Progress

Show users which agent step is active during processing. Send progress events from the API route:

```
"Extracting keywords..." → "Searching news sources..." → "Analyzing articles..." → "Generating summary..."
```

Update `PromptInterface.tsx` to display these progress states instead of the generic "thinking" animation.

---

## 3. Frontend Improvements (P1)

### 3.1 UX Enhancements

**Suggested questions for first-time users**: Show 3-4 clickable example questions when the input is first focused:
- "What's happening between Russia and Ukraine?"
- "How are US-China trade relations evolving?"
- "What's the latest on the Israel-Palestine conflict?"

**Pipeline progress indicator**: Replace the generic pulsing animation during `thinking` state with step-by-step progress:
```
[✓] Extracting keywords    [●] Searching news    [ ] Analyzing    [ ] Summarizing
```

**"Ask another question" flow**: After results display, show a subtle prompt to ask a follow-up or new question, rather than requiring the user to dismiss and re-trigger the input.

**Mobile responsiveness**: The globe uses Three.js/WebGL which is heavy on mobile. Consider:
- Reducing polygon count on mobile
- Using a 2D flat map fallback for small screens (<768px)
- Disabling star field on mobile for performance

### 3.2 Globe Enhancements

**Multi-country support**: Currently hardcoded to exactly 2 countries. Extend to support:
- Single-country analysis (zoom to country, show internal developments)
- 3+ country relationships (multiple arcs, e.g., NATO alliance analysis)
- Update `page.tsx` state from `country1, country2` to `countries: Country[]`

**Click-to-explore**: Let users click any country on the globe to trigger an analysis of that country's current events, without typing a question.

**Relationship legend**: Add a small color-coded legend in the corner showing what each arc color means (red = conflict, green = alliance, etc.).

**Files to modify**:
- `src/components/Globe.tsx` - multi-country arcs, click handler, legend
- `src/app/page.tsx` - state management for multiple countries
- `src/types/tooltip.ts` - extend types for multi-country data

### 3.3 Performance

- **Bundle GeoJSON locally**: Currently fetches country polygons from external URLs on every page load (`page.tsx` lines 16-23). Download and include in `public/data/` instead
- **Optimize Globe loading**: The dynamic import is good, but add a loading skeleton/placeholder while the globe loads
- **Remove unused sample data**: `src/data/sampleTooltips.ts` can be removed or converted to a demo mode

---

## 4. Production Hardening (P0)

### 4.1 Security

| Issue                      | Current State                              | Fix                                                |
| -------------------------- | ------------------------------------------ | -------------------------------------------------- |
| CORS                       | `allow_origins=["*"]` (main.py:22-28)      | N/A after migration (same-origin API routes)        |
| Hardcoded backend URL      | `http://localhost:8000` in PromptInterface  | Use relative URL `/api/analyze` (same origin)       |
| Rate limiting              | None                                       | Add `next-rate-limit` or custom middleware (e.g., 10 req/min per IP) |
| Input validation           | None                                       | Validate prompt length (max 500 chars), sanitize input |
| Prompt injection           | User input directly embedded in LLM prompts | Add system-level guardrails, separate user input from instructions |
| Console logging            | `console.log` / `print()` everywhere       | Remove or gate behind `NODE_ENV !== 'production'`   |

### 4.2 Environment Configuration

```env
# .env.local (development)
OPENROUTER_API_KEY=sk-or-...
SERPER_API_KEY=...              # If using Serper.dev
AI_MODEL=google/gemini-flash-1.5
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Railway (production) - set in dashboard
# Same variables, production values
```

**Files to create/update**:
- `.env.example` at project root (replace `backend/.env.example`)
- `src/lib/agents/config.ts` for centralized config access

### 4.3 Error Handling

- **React Error Boundary**: Wrap `Globe` and `PromptInterface` in error boundaries so a crash in one doesn't take down the page
- **API route error handling**: Return structured error responses with user-friendly messages
- **Graceful degradation**: If the AI API is down, show a helpful message rather than a generic error
- **Retry with backoff**: Add retry logic for transient API failures (OpenRouter, Serper.dev)

### 4.4 Railway Deployment

**Configuration**:
- Railway auto-detects Next.js projects - no `Dockerfile` needed
- Set environment variables in Railway dashboard
- Configure custom domain if desired
- Add a `GET /api/health` endpoint that Railway can use for health checks

**Build settings**:
- Build command: `npm run build`
- Start command: `npm start`
- Node version: 18+

---

## 5. Code Quality & Testing (P1)

### 5.1 Testing Strategy

| Layer       | Tool                    | What to Test                                          |
| ----------- | ----------------------- | ----------------------------------------------------- |
| Unit        | Vitest                  | Agent logic with mocked LLM responses                 |
| Component   | React Testing Library   | PromptInterface states, Globe rendering               |
| Integration | Vitest                  | Full agent chain with mocked external APIs            |
| E2E         | Playwright (optional)   | Full user flow: type question → see globe update      |

**Priority tests**:
1. Agent chain with mocked LLM responses (ensure Zod schemas work correctly)
2. API route `/api/analyze` with mocked agent chain
3. PromptInterface state machine transitions
4. Error handling paths (API failure, rate limit, invalid input)

### 5.2 CI/CD

Add `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
```

### 5.3 Cleanup

- Delete entire `backend/` directory after migration
- Remove `streamlit`, `streamlit-chat`, `asyncio-mqtt` references
- Update `README.md` with new architecture, setup, and deployment instructions
- Update `package.json` scripts if needed
- Clean up `vercel.json` (empty file currently)
- Tighten ESLint rules: re-enable `@typescript-eslint/no-explicit-any` and `@typescript-eslint/ban-ts-comment`

---

## 6. Nice-to-Have Features (P2)

These can be added after the core production launch:

- **Shareable analysis links**: Encode query in URL params (`/analyze?q=ukraine+russia`) so users can share specific analyses
- **Trending topics sidebar**: Pre-compute popular geopolitical topics and show as suggestions
- **Dark/light mode toggle**: Currently dark-only; add a light theme option
- **Keyboard shortcuts**: `Ctrl+K` to focus search, `Escape` to dismiss
- **PWA support**: Add service worker and manifest for mobile "install" capability
- **Analytics**: Plausible or Vercel Analytics (privacy-friendly, no cookie banner needed)
- **OpenGraph meta tags**: Rich link previews when sharing Cartara URLs on social media

---

## Implementation Phases

### Phase 1: Architecture Migration (Week 1-2)
1. Set up Vercel AI SDK with OpenRouter provider
2. Port agent chain to TypeScript with Zod schemas (consolidate 7 → 5 agents)
3. Create Next.js API routes (`/api/analyze`, `/api/health`)
4. Integrate Serper.dev (or OpenRouter web search) for news fetching
5. Wire frontend to new same-origin API routes
6. Delete Python backend
7. Deploy to Railway

### Phase 2: Production Hardening (Week 2-3)
1. Add rate limiting and input validation
2. Add error boundaries and graceful degradation
3. Add response caching (in-memory LRU)
4. Remove console.log statements
5. Add pipeline progress UI (replace generic "thinking" animation)
6. Environment variable configuration

### Phase 3: Polish & Testing (Week 3-4)
1. Add suggested example questions
2. Mobile responsiveness improvements
3. Bundle GeoJSON data locally
4. Globe enhancements (multi-country, legend, click-to-explore)
5. Add Vitest test suite
6. Set up GitHub Actions CI
7. Update README and documentation

### Phase 4: Extras (Ongoing)
- Shareable links, trending topics, analytics, PWA

---

## Success Criteria

- [ ] Single `npm run build && npm start` runs the complete application (no Python process)
- [ ] Deployed and accessible on Railway with a public URL
- [ ] Response time under 6 seconds for typical queries
- [ ] Handles gracefully: API failures, rate limits, empty results, long queries
- [ ] No hardcoded URLs, API keys, or localhost references in source code
- [ ] All TypeScript strict mode errors resolved
- [ ] At least 10 meaningful tests passing in CI
- [ ] README accurately describes setup, architecture, and deployment

---

## Key Files Reference

### Current files to migrate/modify:
- `backend/agents/agent_chain.py` → `src/lib/agents/chain.ts`
- `backend/agents/transformer_agent.py` → `src/lib/agents/transformer.ts`
- `backend/agents/researcher_agent.py` → `src/lib/agents/researcher.ts`
- `backend/agents/relevance_filter_agent.py` → `src/lib/agents/relevance-filter.ts`
- `backend/agents/summarizer_agent.py` + `editor_agent.py` → `src/lib/agents/synthesizer.ts`
- `backend/agents/keyword_extractor_agent.py` + `divider_agent.py` → `src/lib/agents/analyzer.ts`
- `backend/main.py` → `src/app/api/analyze/route.ts`
- `src/components/PromptInterface.tsx` (update API URL, add progress states)
- `src/hooks/useTooltipData.ts` (update API URL)
- `src/components/Globe.tsx` (multi-country support, legend)
- `src/app/page.tsx` (multi-country state)

### New files to create:
- `src/lib/agents/config.ts` (OpenRouter + model configuration)
- `src/lib/agents/types.ts` (shared TypeScript interfaces)
- `src/lib/agents/chain.ts` (orchestrator)
- `src/lib/agents/transformer.ts`
- `src/lib/agents/researcher.ts`
- `src/lib/agents/relevance-filter.ts`
- `src/lib/agents/synthesizer.ts`
- `src/lib/agents/analyzer.ts`
- `src/lib/agents/structurer.ts`
- `src/lib/cache.ts` (in-memory LRU cache)
- `src/app/api/analyze/route.ts`
- `src/app/api/health/route.ts`
- `.env.example` (at project root)
- `.github/workflows/ci.yml`

### Files to delete:
- Entire `backend/` directory (after migration is verified)
- `vercel.json` (empty, not needed for Railway)
