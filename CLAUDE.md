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
| `contracts/api-contract.md` | Backend API contract specification | Yes (coordinate with Python repos) |
| `.env.example` | Environment variable template | Yes |
| `handlers/` | Slack event handlers (future) | Yes |
| `lib/` | Shared utilities (future) | Yes |
| `src/` | Application source (scaffolded, future) | Yes |
| `tests/` | Test suite (future) | Yes |
| `kb/` | Documentation submodule (read-only ref) | No -- update via Documentation repo |
| `opensrc/` | Cached dependency source code | No -- managed by opensrc CLI |

## Critical Rules

1. **PRs only** -- never commit directly to `main`
2. **Short-lived PRs** -- one change per PR, fast follow-ups over scope creep
3. **Review comments become rules** -- add recurring feedback to this file
4. **No pipeline logic** -- classification, analysis, solving, execution belong in Python repos
5. **Contract changes require coordination** -- if you change `contracts/api-contract.md`,
   both Python backends must be updated to match
6. **Do not hardcode SDK packages** -- the Slack agent template scaffold determines exact
   package names and framework. Use placeholder references until scaffold is generated.

## Backend API Contract

Both Python backends expose a uniform HTTP API:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/process` | Start a workflow |
| `POST /api/decision` | Record a human decision |
| `GET /api/runs/{run_id}` | Retrieve run details |

See `contracts/api-contract.md` for full request/response schemas.

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
| `LEGACY_SLACK_ENABLED` | No | `true` keeps legacy Slack paths in Python repos |
| `DOCS_REPO_PAT` | CI only | Fine-grained PAT for cross-repo doc PRs |

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
