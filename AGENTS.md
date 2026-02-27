# AGENTS.md

Navigation guide for AI agents working on Service_B.
Read this file before exploring any other files in this repository.

## What This Repo Is

**Service_B** — a service in the `pikkitco-ai-sandbox` org, currently in early development.

## Navigation Map

| What you need | Where to look |
| --- | --- |
| Agent instructions | [`CLAUDE.md`](CLAUDE.md) |
| Project overview | [`README.md`](README.md) |
| Cross-repo docs | `kb/docs/` (submodule) |
| Shared glossary | `kb/docs/glossary.md` (submodule) |

## Rules for Agents Editing This Repo

1. **PRs only** — never commit directly to `main`
2. **Update this file** (`AGENTS.md`) whenever you add a new top-level path or key module
3. **Short-lived PRs** — one change per PR

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