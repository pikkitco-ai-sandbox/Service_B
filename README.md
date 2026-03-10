# Service_B — Chat Gateway

Chat gateway and Slack agent service for the `pikkitco-ai-sandbox` org.

Service_B receives interactive events from Slack (mentions, button clicks, slash commands),
calls the Python backend orchestrators via a standardized HTTP API, and renders responses as
interactive cards with Approve/Reject/Modify buttons.

## Architecture

```text
Slack ──> Service_B (Next.js 14 on Vercel)
             |
             ├─ /api/slack/events        ──> app_mention → keyword inference → backend
             ├─ /api/slack/commands       ──> /mislink or /support → backend
             ├─ /api/slack/interactions   ──> button clicks → backend decision
             └─ /api/health              ──> health check
             |
             ├─ POST /api/process        ──> Dummy_Agent   (support tickets)
             ├─ POST /api/gateway/process ──> Mislink_Agent (mislink resolution)
             ├─ POST /api/decision       ──> either backend (human decisions)
             └─ GET  /api/runs/:id       ──> either backend (run status)
```

**Service_B does NOT contain pipeline logic.** All classification, analysis, solving, and
execution stays in the Python repos. This service is a thin translation layer between
Slack and the backends.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Slack SDK:** @slack/web-api (WebClient only — no Bolt, compatible with Vercel serverless)
- **Serverless:** @vercel/functions (`waitUntil` keeps functions alive for async Slack follow-ups)
- **Tests:** Vitest
- **Deploy:** Vercel (`https://pikkit-service-b.vercel.app`)

## Project Structure

```text
src/
  app/
    api/
      health/route.ts           Health check
      slack/
        events/route.ts         app_mention handler
        commands/route.ts       Slash command handler (/mislink, /support)
        interactions/route.ts   Button action handler (approve/reject/modify)
  lib/
    backend/
      client.ts                 HTTP client for Python backends
      router.ts                 Workflow routing (command + keyword inference)
    contracts/
      gateway.ts                TypeScript types matching Python backend contracts
    slack/
      blocks.ts                 Block Kit card builders
      client.ts                 Slack WebClient singleton
      parse.ts                  Event/command parsing
      verify.ts                 Slack request signature verification
    state/
      adapter.ts                StateAdapter interface
      memory.ts                 In-memory adapter (dev)
      redis.ts                  Redis adapter (production)
      index.ts                  Adapter factory
contracts/
  api-contract.md               Backend API contract specification
tests/                          Vitest test suite
```

## Getting Started

```bash
npm install
cp .env.example .env            # Fill in Slack credentials + backend URLs
npm run dev                     # Next.js dev server on :3000
npm test                        # Run tests
```

### Mock Mode (no backends needed)

```bash
CHAT_BACKEND_MODE=mock npm run dev
```

Mock mode responds to all Slack interactions with `[Mock]` prefixed messages
instead of calling real backends.

## Feature Flags

| Flag | Effect |
| --- | --- |
| `NEW_CHAT_LAYER_ENABLED=true` | Enables Slack route processing (when `false`, routes acknowledge but do nothing) |
| `CHAT_BACKEND_MODE=mock` | Returns mock responses instead of calling backends |
| `LEGACY_SLACK_ENABLED=true` | Keeps legacy Slack paths active in Python repos |

## Backend API Contract

Both Python backends expose a uniform HTTP API. See `contracts/api-contract.md` for the
full specification.

## Documentation

This repo participates in the org-wide documentation pipeline. See
[Documentation repo](https://github.com/pikkitco-ai-sandbox/Documentation) for the shared
knowledge base.

```bash
git submodule update --init --recursive   # Mount docs at kb/
```
