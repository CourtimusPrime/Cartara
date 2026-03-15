# Cartara

A geopolitical intelligence visualization tool that transforms natural language questions about world events into AI-analyzed, source-cited summaries displayed on an interactive 3D globe.

## Features

- **3D Globe Visualization** - Interactive globe with color-coded relationship arcs between countries
- **Natural Language Questions** - Ask questions like "What's happening between Russia and Ukraine?"
- **AI Agent Chain** - Multi-step pipeline: keyword extraction, news search, relevance filtering, synthesis, and analysis
- **Source Citations** - Every analysis includes cited news sources with links
- **Relationship Mapping** - Color-coded arcs show conflict (red), alliance (green), trade (yellow), tensions (orange), and diplomatic (white) relationships

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **3D Visualization:** react-globe.gl, Three.js
- **AI:** Vercel AI SDK with OpenRouter (flexible model selection)
- **News Data:** Serper.dev (Google News search)
- **Deployment:** Railway

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- An [OpenRouter API key](https://openrouter.ai/keys)
- A [Serper.dev API key](https://serper.dev)

### Setup

1. **Clone and install:**

   ```sh
   git clone https://github.com/courtimusprime/cartara.git
   cd cartara
   npm install
   ```

2. **Configure environment:**

   ```sh
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:

   ```
   OPENROUTER_API_KEY=sk-or-...
   SERPER_API_KEY=...
   ```

3. **Run locally:**

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - ESLint
- `npm run format` - Prettier

## Architecture

```
User Question
    |
    v
[Transformer] Extract keywords
    |
    v
[Researcher] Search news via Serper.dev
    |
    v
[Relevance Filter] AI filters relevant articles
    |
    v
[Synthesizer] Summarize + edit + cite
    |
    v
[Analyzer] Extract countries + structure paragraphs
    |
    v
3D Globe Visualization
```

All agents run as Next.js API routes (`/api/analyze`) using the Vercel AI SDK with OpenRouter for flexible, cost-optimized model selection.

## Deployment

Deployed on Railway. Set the same environment variables from `.env.example` in your Railway dashboard.

## License

MIT
