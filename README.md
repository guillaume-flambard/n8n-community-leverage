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
gh api --paginate --slurp '/repos/n8n-io/n8n/issues?state=open&per_page=100' > data/issues_raw.json
gh api --paginate --slurp '/repos/n8n-io/n8n/pulls?state=open&per_page=100'  > data/pulls_raw.json
node src/leverage.ts
```

## Roadmap (v2)

- **Semantic clustering** — replace keyword themes with embedding clusters (pgvector) for
  true duplicate detection. ~39% of issues currently fall in "Other"; embeddings cut that.
- **PR review depth** — join mergeability + CI status + linked-issue leverage so the review
  queue ranks by "closest to merge × highest impact."
- **Contributor briefs** — auto-generate a scoped "good first issue" brief + code entry
  points for each top theme, converting backlog into community contributions.
- **Ship as an n8n workflow** — Schedule → GitHub nodes → AI/LangChain embedding → pgvector
  → report, dogfooding the product it triages.

## Honest limits

v1 uses structural signals only (no NLP). Theme buckets are keyword/label heuristics.
PR ranking uses engagement + recency, not yet mergeability. These are the v2 seams above.
