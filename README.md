# AutoRAG Search Interface

A streamlined search interface for Cloudflare's AutoRAG system, built with Astro. Features include:

- Real-time streaming responses
- Infinite scroll with context-aware follow-up queries
- Markdown rendering support
- Responsive design with mobile optimization

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Cloudflare:
- Ensure you have a Cloudflare account with AutoRAG enabled
- Set up your AutoRAG instance with the ID "aopa-rag"
- Configure your wrangler.jsonc with appropriate AI bindings

## Development

Run locally with Wrangler for full Cloudflare Workers functionality:

```bash
npm run build && npx wrangler pages dev ./dist
```

This will start the development server with Cloudflare Workers support, typically at `localhost:8788`.

## Project Structure

```text
/
├── src/
│   ├── components/
│   │   └── AutoRAGStream.astro   # Main streaming component
│   └── pages/
│       ├── index.astro           # Main search interface
│       └── api/
│           └── stream.ts         # Streaming API endpoint
├── astro.config.mjs              # Astro configuration
└── wrangler.jsonc               # Cloudflare Workers configuration
```

## Production Deployment

Deploy to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist
```

## Environment Variables

The following bindings need to be configured in your Cloudflare dashboard:

- `AI`: Cloudflare AI binding for AutoRAG functionality

