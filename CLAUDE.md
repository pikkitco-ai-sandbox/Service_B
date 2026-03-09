# CLAUDE.md — Agent Instructions

This file is the canonical instruction set for AI coding agents (Claude Code, GitHub Copilot) working
on this repository. Read it completely before making any changes.

## What This Repo Is

**Service_B** — the chat gateway and Slack agent service for the `pikkitco-ai-sandbox` org.
It receives Slack events, calls the Python backend orchestrators (Dummy_Agent, Mislink_Agent)
via a standardized HTTP API, and renders responses as interactive Slack cards.

**Service_B contains NO pipeline logic.** All classification, analysis, solving, and execution
stays in the Python repos. This service is a thin translation layer.

## Key Locations

| Path | Purpose | Safe to Edit |
| --- | --- | --- |
| `CLAUDE.md` | Agent instructions (this file) | Yes |
| `AGENTS.md` | Navigation guide for AI agents | Yes |
| `README.md` | Project overview and setup | Yes |
| `TESTING.md` | Mock and live Slack test procedures | Yes |
| `OPERATIONS.md` | Deployment, rollback, cutover, failure modes | Yes |
| `contracts/api-contract.md` | Backend API contract specification | Yes (coordinate with Python repos) |
| `.env.example` | Environment variable template | Yes |
| `src/app/api/slack/events/route.ts` | app_mention event handler | Yes |
| `src/app/api/slack/commands/route.ts` | Slash command handler (/mislink, /support) | Yes |
| `src/app/api/slack/interactions/route.ts` | Button action handler (approve/reject/modify) | Yes |
| `src/app/api/health/route.ts` | Health check endpoint | Yes |
| `src/lib/contracts/gateway.ts` | TypeScript contract types matching Python backends | Yes |
| `src/lib/backend/client.ts` | HTTP client for Python backends | Yes |
| `src/lib/backend/router.ts` | Workflow routing (command + keyword inference) | Yes |
| `src/lib/slack/verify.ts` | Slack request signature verification | Yes |
| `src/lib/slack/parse.ts` | Event/command parsing | Yes |
| `src/lib/slack/blocks.ts` | Block Kit card builders | Yes |
| `src/lib/slack/client.ts` | Slack WebClient singleton | Yes |
| `src/lib/log.ts` | Structured JSON logger (never logs secrets) | Yes |
| `src/lib/state/` | State adapter (memory + Redis) | Yes |
| `tests/` | Vitest tests for routing, parsing, contracts, actions | Yes |
| `kb/` | Documentation submodule (read-only ref) | No -- update via Documentation repo |
| `opensrc/` | Cached dependency source code | No -- managed by opensrc CLI |

## Critical Rules

1. **PRs only** -- never commit directly to `main`
2. **Short-lived PRs** -- one change per PR, fast follow-ups over scope creep
3. **Review comments become rules** -- add recurring feedback to this file
4. **No pipeline logic** -- classification, analysis, solving, execution belong in Python repos
5. **Contract changes require coordination** -- if you change `contracts/api-contract.md`,
   both Python backends must be updated to match
6. **Framework: Next.js 14 with App Router. Slack SDK: @slack/web-api. Test runner: vitest.**

## Backend API Contract

Both Python backends expose a uniform HTTP API:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/process` | Start a workflow |
| `POST /api/decision` | Record a human decision |
| `GET /api/runs/{run_id}` | Retrieve run details |

See `contracts/api-contract.md` for full request/response schemas.

## Slack Routes

| Route | Purpose |
| --- | --- |
| `/api/slack/events` | Event Subscriptions (app_mention) |
| `/api/slack/commands` | Slash commands (/mislink, /support) |
| `/api/slack/interactions` | Interactive components (button clicks) |
| `/api/health` | Health check |

## Environment

```bash
cp .env.example .env
# Fill in values -- see comments in .env.example
```

| Variable | Required | Notes |
| --- | --- | --- |
| `SLACK_BOT_TOKEN` | Yes | Slack Bot OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Yes | HMAC signing secret |
| `SLACK_APP_TOKEN` | If Socket Mode | App-level token (`xapp-...`) |
| `REDIS_URL` | No | State adapter (omit for in-memory dev mode) |
| `DUMMY_AGENT_BASE_URL` | Yes | Base URL of Dummy_Agent API |
| `MISLINK_AGENT_BASE_URL` | Yes | Base URL of Mislink_Agent API |
| `CHAT_BACKEND_MODE` | No | `live` or `mock` (default: `mock`) |
| `NEW_CHAT_LAYER_ENABLED` | No | `true` enables new chat layer routing |
| `LEGACY_SLACK_ENABLED` | No | `true` keeps legacy Slack paths in Python repos |
| `DOCS_REPO_PAT` | CI only | Fine-grained PAT for cross-repo doc PRs |

## Local Development

```bash
npm install
npm run dev          # starts Next.js dev server on :3000
npm test             # run vitest
CHAT_BACKEND_MODE=mock npm run dev  # mock mode (no backends needed)
```

## Testing

```bash
npm test             # all tests
npm run test:watch   # watch mode
```

See `TESTING.md` for Slack integration test procedures (mock and live mode).

## Logging

All route handlers emit structured JSON logs via `src/lib/log.ts`. Logs include:
`source` (event/command/interaction), `workflow`, `mode` (mock/live), `ticket_id`, `run_id`.
Backend client logs `backend_url`, `status_code`, `duration_ms`.

**Never log secrets.** The logger does not have access to tokens or signing secrets.

See `OPERATIONS.md` for how to view logs in Vercel.

## Documentation System

This repo is part of an org-wide documentation pipeline centred on
`pikkitco-ai-sandbox/Documentation`.

**Cross-repo docs via submodule:**

```bash
# First-time setup (only needed once per clone)
git submodule add https://github.com/pikkitco-ai-sandbox/Documentation.git kb

# After cloning (or when submodule is already declared in .gitmodules)
git submodule update --init --recursive
```

Docs are then available at `kb/docs/` paths (e.g. `kb/docs/glossary.md`).
