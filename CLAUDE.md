# CLAUDE.md — Agent Instructions

This file is the canonical instruction set for AI coding agents (Claude Code, GitHub Copilot) working
on this repository. Read it completely before making any changes.

## What This Repo Is

**Service_B** — a service in the `pikkitco-ai-sandbox` org. This repo is currently in early
development. Check `AGENTS.md` for the navigation guide and `README.md` for setup instructions.

## Key Locations

| Path | Purpose | Safe to Edit |
| --- | --- | --- |
| `CLAUDE.md` | Agent instructions (this file) | Yes |
| `AGENTS.md` | Navigation guide for AI agents | Yes |
| `README.md` | Project overview and setup | Yes |
| `kb/` | Documentation submodule (read-only ref) | No — update via Documentation repo |

## Critical Rules

1. **PRs only** — never commit directly to `main`
2. **Short-lived PRs** — one change per PR, fast follow-ups over scope creep
3. **Review comments become rules** — add recurring feedback to this file

## Documentation System

This repo is part of an org-wide documentation pipeline centred on
`pikkitco-ai-sandbox/Documentation`.

**Cross-repo docs via submodule:**

The Documentation repo can be included as a git submodule at `kb/`:

```bash
# First-time setup (only needed once per clone)
git submodule add https://github.com/pikkitco-ai-sandbox/Documentation.git kb

# After cloning (or when submodule is already declared in .gitmodules)
git submodule update --init --recursive
```

Docs are then available at `kb/docs/` paths (e.g. `kb/docs/glossary.md`).

## Environment

Secrets live as GitHub repo secrets/variables. For local dev, create a `.env` file from
`.env.example` when one is added.
