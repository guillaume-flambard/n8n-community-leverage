# n8n Community Leverage Engine

**I don't just prioritize n8n's backlog — I turn it into contributions.**

[![CI](https://github.com/guillaume-flambard/n8n-community-leverage/actions/workflows/ci.yml/badge.svg)](https://github.com/guillaume-flambard/n8n-community-leverage/actions/workflows/ci.yml)
[![PR #33785 — MCP Headers](https://img.shields.io/badge/PR-%2333785-blue?logo=github)](https://github.com/n8n-io/n8n/pull/33785)
[![Issues analyzed](https://img.shields.io/badge/issues-427-blue)](#)
[![Live workflows](https://img.shields.io/badge/workflows-10%20live-success)](#)
[![Tests](https://img.shields.io/badge/tests-17%2F17-brightgreen)](#)

Built as a work sample for **n8n Community Engineer**. Ranks the entire open backlog
(427 issues + 1029 PRs) by **leverage** — severity × reach × recency — so maintainers
know where their next hour pays off most. Then turns the top themes into contributor-ready
briefs via local LLM. All running as n8n workflows on a VPS.

---

## Quick links

| What | Link |
|------|------|
| Upstream PR (merged tests, CI green) | [#33785](https://github.com/n8n-io/n8n/pull/33785) |
| Live chat copilot | [n8n.phangan.ai](https://n8n.phangan.ai) |
| Demo script | [DEMO.md](DEMO.md) |
| Latest ranked report | [REPORT.md](REPORT.md) |
| Contributor briefs | [BRIEFS.md](BRIEFS.md) |

---

## What this proves for n8n

| Requirement | Evidence |
|---|---|
| **TS/Node proficiency** | PR #33785 merged clean, 24/24 tests green. CI pipeline runs typecheck + 17 unit tests on push. Full monorepo toolchain (pnpm, Turborepo). |
| **Debugging + API/OAuth** | Echo Travel prod — Omise API payment fix, OAuth debugging, monitoring. |
| **Open-source contribution** | Real upstream PR. Backlog analysis. Community-facing tooling. |
| **Tooling/automation** | 10 n8n workflows, local LLM pipeline, semantic clustering (139 themes, no "Other"). |
| **Written communication** | PR comments, briefs, README, demo script. Async-native. |

---

## Architecture

```
GitHub API ──→ Leverage formula ──→ Data Tables ──→ Chat Copilot (7 tools)
                   │                                    │
                   ↓                                    ↓
            Semantic clusters                    AI Agent + Ollama
            (nomic-embed-text)                   (llama3.2, local)
                   │                                    │
                   ↓                                    ↓
            Contributor briefs ──────────→ Real PRs (see #33785)
```

**Zero cloud API keys. Zero network egress for ML. All inference local via Ollama.**

---

## The formula

```
leverage   = reach × severity × recency
reach      = 1 + 2·ln(1+reactions) + ln(1+comments)
severity   = label weight (bug=3.0, enhancement=1.6, docs=0.8)
recency    = exp(-idleDays / 60)
```

Reactions are log-compressed to prevent single-viral dominance. Churn risk surfaces
old popular issues that quietly bleed community trust.

---

## n8n workflows (live on VPS)

| Workflow | File | What it does |
|----------|------|-------------|
| **Daily ranking** | [`workflows/leverage-workflow.json`](workflows/leverage-workflow.json) | Schedule 08:00 → GitHub issues + PRs → Data Table upsert |
| **Chat copilot** | [`workflows/leverage-copilot-workflow.json`](workflows/leverage-copilot-workflow.json) | AI Agent + 7 tools (semantic search, ranking, comment thread, deep-dive, PR linker, code scout) + Ollama |
| **Index bootstrap** | [`workflows/leverage-bootstrap-workflow.json`](workflows/leverage-bootstrap-workflow.json) | Load 442 docs into vector store |
| **Fetch comments** | [`workflows/leverage-fetch-comments-workflow.json`](workflows/leverage-fetch-comments-workflow.json) | Comment thread on demand |
| **Issue deep dive** | [`workflows/leverage-deep-dive-workflow.json`](workflows/leverage-deep-dive-workflow.json) | Thread synthesis + contributor proposal |
| **Issue PR linker** | [`workflows/leverage-issue-linker-workflow.json`](workflows/leverage-issue-linker-workflow.json) | Find PRs mentioning an issue |
| **Code scout** | [`workflows/leverage-code-scout-workflow.json`](workflows/leverage-code-scout-workflow.json) | GitHub code search (read-only) |
| **Error handler** | [`workflows/leverage-error-handler-workflow.json`](workflows/leverage-error-handler-workflow.json) | Discord alerts on any workflow failure |

All workflows: error handler connected, timezone Europe/Paris, async-safe, executionOrder v2.
The copilot chat trigger is restricted to POST and supports optional auth via `LEVERAGE_COPILOT_SECRET` env var (`x-leverage-secret` header).

---

## CLI tool (standalone, no n8n needed)

```bash
npm run fetch                     # pull live backlog
node src/leverage_v2.ts           # semantic clustering → REPORT_v2.md
node src/briefs.ts                # LLM contributor briefs → BRIEFS.md
npm run export:docs               # vector docs for n8n store
```

Requires Node ≥22 and [ollama](https://ollama.com) (`ollama pull nomic-embed-text`).

---

## Honest limits

- Semantic clustering is embedding similarity, not per-issue LLM reasoning (that runs on-demand via deep-dive).
- PR ranking uses engagement + recency, not mergeability yet.
- Code scout returns path hypotheses — human review before patching (see PR #33785).

---

*Built by [Guillaume Flambard](https://github.com/guillaume-flambard) — applying for Community Engineer at n8n.*
