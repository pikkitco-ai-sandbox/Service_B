---
status: accepted
date: 2026-03-14
---

# Events API Over Socket Mode for Slack Integration

## Context and Problem Statement

Service_B is the Slack gateway for the pikkitco-ai-sandbox org, deployed on Vercel as a Next.js
application. Slack offers two mechanisms for receiving events: the **Events API** (HTTP webhooks)
and **Socket Mode** (persistent WebSocket connections). We need to choose which mechanism to use
for receiving `app_mention` events, slash commands, and interactive component payloads.

## Decision Drivers

- Service_B runs on Vercel (serverless functions with ~10s execution limit, no persistent processes)
- Vercel's `waitUntil()` enables async background work after responding to Slack's 3-second deadline
- Socket Mode requires a long-lived process to maintain a WebSocket connection
- The Slack app dashboard already has Socket Mode disabled and Events API URL configured
- Consistency with the existing `@slack/web-api` dependency (HTTP-based, no socket dependency)

## Considered Options

1. **Events API (HTTP webhooks)** — Slack sends HTTP POST to route handlers
2. **Socket Mode (WebSocket)** — Service_B maintains a persistent WebSocket connection to Slack
3. **Hybrid** — Events API for commands/interactions, Socket Mode for real-time events

## Decision Outcome

Chosen option: **"Events API (HTTP webhooks)"**, because serverless deployment on Vercel is
fundamentally incompatible with Socket Mode's persistent connection requirement.

### Consequences

- Good, because Vercel's serverless model handles scaling automatically
- Good, because `waitUntil()` solves the 3-second response deadline without Socket Mode
- Good, because no additional infrastructure (persistent server, container) is needed
- Good, because the existing `@slack/web-api` WebClient is sufficient — no `@slack/socket-mode` dependency
- Bad, because Events API requires a publicly accessible URL (handled by Vercel's deployment)
- Bad, because URL verification challenge must be handled on initial setup (one-time cost)

## Pros and Cons of the Options

### Events API (HTTP webhooks)

- Good, because it works natively with serverless (Vercel, AWS Lambda, Cloudflare Workers)
- Good, because Slack retries failed deliveries automatically
- Good, because no persistent process to monitor or restart
- Bad, because requires a public URL (not usable for local development without a tunnel)

### Socket Mode (WebSocket)

- Good, because no public URL needed (works behind firewalls)
- Good, because lower latency for event delivery
- Bad, because requires a persistent process — incompatible with Vercel serverless
- Bad, because adds `@slack/socket-mode` dependency and a separate runtime
- Bad, because connection drops require reconnection logic and health monitoring

### Hybrid

- Good, because could optimize for each event type
- Bad, because doubles the complexity — two event delivery paths to maintain
- Bad, because still requires persistent infrastructure for the Socket Mode component

## Confirmation

- `src/app/api/slack/events/route.ts` handles `url_verification` challenge and `app_mention` events via HTTP POST
- `src/lib/slack/client.ts` uses `@slack/web-api` WebClient only — no socket dependency
- Vercel's `waitUntil()` is used for async processing after the 200 response
- The Slack app dashboard shows Socket Mode: OFF
- `SLACK_APP_TOKEN` (xapp-...) is documented as optional ("If Socket Mode") but not used in code

## More Information

- Related: Service_B deploys on Vercel with Next.js 14 App Router
- The `SLACK_APP_TOKEN` env var exists in `.env.example` for documentation completeness but is
  not read by any code path
- If a future service needs Socket Mode (e.g., a dedicated real-time bot), it should be a
  separate deployment, not Service_B
