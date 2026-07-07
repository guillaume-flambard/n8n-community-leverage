# n8n Community Leverage Engine

Ranks the entire open n8n backlog (427 issues + 1029 PRs) by **leverage** — what to
fix and review *first* to help the most people — instead of by date or raw reaction
count. Built as a work sample for the n8n Community Engineer role.

## Why

n8n already ships AI workflows that label issues one at a time. That leaves the real
question open: across a 1,400-item backlog, where does a maintainer's next hour pay off
most? This tool answers that, and turns the answer into contributor-ready work.

## What it does

1. Pulls the live open backlog from the GitHub API (issues + PRs, with reactions).
2. Scores every item by leverage and by churn risk.
3. Groups issues into themes so duplicate reports collapse into one fix.
4. Emits a ranked report ([REPORT.md](REPORT.md)):
   - **Fix these themes first** — highest aggregate leverage.
   - **Highest-leverage single issues.**
   - **Churn risk** — popular issues left to rot (goodwill bleed).
   - **Community PRs to review first** — the 1,000-PR mountain, prioritized.

## The formula

```
leverage   = reach × severity × recency
reach      = 1 + 2·ln(1+reactions) + ln(1+comments)   # log-compressed "me too"
severity   = label weight (bug 3.0 → docs 0.8)
recency    = exp(-idleDays / 60)                        # still-live decay
churnRisk  = reach × severity × ln(1+ageDays) × min(1, idleDays/30)   # rewards neglect
```

Reactions are log-compressed so one viral thread can't dominate. Churn risk is the
deliberate inverse of leverage: it surfaces what the leverage sort hides — old, popular,
ignored issues that quietly burn community trust.

## Run

```bash
# needs: gh (authenticated) + Node >= 22
npm run fetch          # pull the live backlog into data/

node src/leverage.ts    # v1 — keyword themes         -> REPORT.md
node src/leverage_v2.ts # v2 — semantic clustering     -> REPORT_v2.md
node src/briefs.ts      # contributor briefs (local LLM) -> BRIEFS.md
```

v2 needs a local [ollama](https://ollama.com) with `nomic-embed-text` pulled
(`ollama pull nomic-embed-text`). Embeddings are cached to `data/embeddings.json`,
so re-runs are instant. Tune cluster granularity with `THRESH=0.74 node src/leverage_v2.ts`.

## v2 — semantic clustering (implemented)

v1's keyword buckets left ~39% of issues in "Other". v2 embeds every issue locally
with `nomic-embed-text` (no API key, no network egress — the vector store is
in-process) and clusters by cosine similarity. Result: **427 issues collapse into
139 themes with no "Other" bucket**, and issues that share no keywords but describe
the same problem land in the same theme. Same normalized vectors drop into pgvector
unchanged when this needs to scale.

## Contributor briefs (implemented)

`briefs.ts` takes the top semantic themes and has a local LLM (llama3.2 / qwen via
ollama) draft a scoped **contributor brief** per theme — problem synthesis, likely
area, suggested approach, scope, and good-first-issue call — landing in
[BRIEFS.md](BRIEFS.md). Themes I have mapped by hand (e.g. MCP) also carry verified
code entry points. This is the point of the tool: it does not just rank the backlog,
it turns the top of it into contributable work. Briefs are labelled as hypotheses.

## Roadmap

- **PR review depth** — join mergeability + CI status + linked-issue leverage so the review
  queue ranks by "closest to merge × highest impact."
- **Ship as an n8n workflow** — Schedule → GitHub nodes → AI/LangChain embedding → pgvector
  → report, dogfooding the product it triages.

## Honest limits

Signals are structural + embedding similarity; no per-issue LLM reasoning yet. PR ranking
uses engagement + recency, not mergeability. Cluster names are salient-term heuristics.
These are the roadmap seams above.
