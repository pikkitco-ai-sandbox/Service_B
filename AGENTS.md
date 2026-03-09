# AGENTS.md

Navigation guide for AI agents working on Service_B.
Read this file before exploring any other files in this repository.

## What This Repo Is

**Service_B** — the chat gateway and Slack agent service for the `pikkitco-ai-sandbox` org.
Sits between Slack and the Python backend orchestrators (Dummy_Agent, Mislink_Agent).

**Service_B does NOT contain pipeline logic.** It translates Slack events into backend API
calls and renders backend responses as interactive Slack cards.

**Stack:** Next.js 14 (App Router), @slack/web-api, Vitest, Vercel.

## Navigation Map

| What you need | Where to look |
| --- | --- |
| Agent instructions | [`CLAUDE.md`](CLAUDE.md) |
| Project overview | [`README.md`](README.md) |
| API contract specification | [`contracts/api-contract.md`](contracts/api-contract.md) |
| Environment variables | [`.env.example`](.env.example) |
| Slack event handler | [`src/app/api/slack/events/route.ts`](src/app/api/slack/events/route.ts) |
| Slash command handler | [`src/app/api/slack/commands/route.ts`](src/app/api/slack/commands/route.ts) |
| Button action handler | [`src/app/api/slack/interactions/route.ts`](src/app/api/slack/interactions/route.ts) |
| Health check | [`src/app/api/health/route.ts`](src/app/api/health/route.ts) |
| Backend HTTP client | [`src/lib/backend/client.ts`](src/lib/backend/client.ts) |
| Workflow routing | [`src/lib/backend/router.ts`](src/lib/backend/router.ts) |
| Contract types | [`src/lib/contracts/gateway.ts`](src/lib/contracts/gateway.ts) |
| Block Kit cards | [`src/lib/slack/blocks.ts`](src/lib/slack/blocks.ts) |
| Slack client | [`src/lib/slack/client.ts`](src/lib/slack/client.ts) |
| Request parsing | [`src/lib/slack/parse.ts`](src/lib/slack/parse.ts) |
| Signature verification | [`src/lib/slack/verify.ts`](src/lib/slack/verify.ts) |
| State adapters | [`src/lib/state/`](src/lib/state/) |
| Tests | [`tests/`](tests/) |
| Architecture decisions | [`docs/adr/`](docs/adr/) |
| Cross-repo docs | `kb/docs/` (submodule) |
| Shared glossary | `kb/docs/glossary.md` (submodule) |

## Service Architecture

```text
Slack events ──> src/app/api/slack/
                     ├── events/route.ts      (app_mention → parse → backend → card)
                     ├── commands/route.ts     (slash commands → route → backend → card)
                     └── interactions/route.ts (button clicks → decision → result)
                            |
                            v
                      src/lib/backend/
                     ├── router.ts             (workflow selection)
                     └── client.ts             (HTTP calls to Python backends)
                            |
                            v
                      Python backends
                     ├── Dummy_Agent    POST /api/process, /api/decision
                     └── Mislink_Agent  POST /api/gateway/process, /api/gateway/decision
```

## Ownership Boundaries

| Layer | Owner | What lives here |
| --- | --- | --- |
| Slack interaction | Service_B | Route handlers, card rendering, state adapter |
| Backend API contract | Shared | `contracts/api-contract.md` defines the interface |
| Pipeline logic | Python repos | Classification, analysis, solving, execution |

## Rules for Agents Editing This Repo

1. **PRs only** — never commit directly to `main`
2. **Update this file** (`AGENTS.md`) whenever you add a new top-level path or key module
3. **Short-lived PRs** — one change per PR
4. **No pipeline logic** — if you're tempted to add classification, analysis, or solving,
   it belongs in Dummy_Agent or Mislink_Agent instead
5. **Contract changes require coordination** — updating `contracts/api-contract.md` means
   updating the Python backends too

## Cross-Repo Navigation (Submodule)

When the Documentation repo is mounted as a submodule at `kb/`:

| What you need | Submodule path |
| --- | --- |
| Service docs | `kb/docs/services/service-b.md` |
| Function docs | `kb/docs/functions/<name>.md` |
| Glossary | `kb/docs/glossary.md` |
| Full nav guide | `kb/AGENTS.md` |

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->
