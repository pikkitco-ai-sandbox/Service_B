# Service_B — Chat Gateway

Chat gateway and Slack agent service for the `pikkitco-ai-sandbox` org.

Service_B receives interactive events from Slack (mentions, button clicks, slash commands),
calls the Python backend orchestrators via a standardized HTTP API, and renders responses as
interactive cards with Approve/Reject/Modify buttons.

## Architecture

```text
Slack ──> Service_B (this repo)
             |-- POST /api/process  --> Dummy_Agent   (support tickets)
             |-- POST /api/process  --> Mislink_Agent (mislink resolution)
             |-- POST /api/decision --> either backend (human decisions)
             '-- GET  /api/runs/:id --> either backend (run status)
```

**Service_B does NOT contain pipeline logic.** All classification, analysis, solving, and
execution stays in the Python repos. This service is a thin translation layer between
Slack and the backends.

## Status

Architecture and contracts defined. Scaffold pending. The Slack agent template will
determine the exact package manager, framework, and package names.

## Planned Structure

```text
src/          Application source (scaffolded by Slack agent template)
handlers/     Event handlers (onNewMention, onAction, slash commands)
lib/          Shared utilities (HTTP client, card builders, state adapter)
contracts/    API contract definitions and types
tests/        Test suite
```

## Getting Started

Setup will be finalized after scaffold generation. Expected flow:

1. Run the Slack agent skill wizard to scaffold the project
2. `cp .env.example .env` and fill in Slack credentials + backend URLs
3. Install dependencies (package manager TBD by scaffold)
4. Start dev server
5. Test with Slack development workspace

## Backend API Contract

Both Python backends expose a uniform HTTP API. See `contracts/api-contract.md` for the
full specification.

## Documentation

This repo participates in the org-wide documentation pipeline. See
[Documentation repo](https://github.com/pikkitco-ai-sandbox/Documentation) for the shared
knowledge base.

```bash
git submodule add https://github.com/pikkitco-ai-sandbox/Documentation.git kb
git submodule update --init --recursive
```
