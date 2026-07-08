# Leverage Engine — Demo Script

## 60-second pitch (async / intro call)

> I don't just prioritize n8n's backlog — I turn it into contributions.
>
> I built a leverage scorer across 427 open issues, clustered them into 139 themes,
> and found the top pain is **AI Agent / tool / memory** — right in n8n's mission.
>
> It runs daily as an n8n workflow on my VPS: GitHub node → leverage formula → Data Table.
> And I added a **chat copilot** so you can ask the backlog live.
>
> I also opened [PR #33785](https://github.com/n8n-io/n8n/pull/33785) on MCP Server Trigger headers —
> a real fix in their repo, tests green.

---

## Live demo (5 min screen share)

### Acte 1 — Preuve prod (30 sec)

1. Ouvrir https://n8n.phangan.ai (ou tunnel SSH)
2. **Data tables** → `leverage_ranking`
3. Montrer #14361 en tête, colonne `leverage`, `scoredAt` d'aujourd'hui
4. Phrase : *"Ça tourne tous les matins à 8h, sans intervention."*

### Acte 2 — Chat Copilot (2 min)

1. Workflow **Leverage Copilot — ask the backlog** → onglet **Chat**
2. Question préparée : *"Why is #14361 ranked first?"*
3. Question thème : *"What MCP issues hurt most right now?"*
4. Question contributeur : *"Suggest a good-first-issue on AI Agent memory."*
5. Phrase : *"RAG sur 427 issues + top-25 live depuis la Data Table."*

> Si le vector store est vide (après restart n8n) : exécuter une fois
> **Leverage — index bootstrap (run once)** (~6 min).

### Acte 3 — Contribution code (1 min)

1. [PR #33785](https://github.com/n8n-io/n8n/pull/33785) — MCP headers
2. Phrase : *"J'ai identifié un gap que vos users remontent, j'ai shipé le fix avec tests."*

### Questions de secours si le chat est lent

Réponses pré-écrites depuis [BRIEFS.md](BRIEFS.md) thème **agent / tool / memory**.

---

## Loom 90 sec — storyboard

| Sec | Visuel | Voix off |
|-----|--------|----------|
| 0–10 | Data Table `leverage_ranking`, scroll #14361 | "Every morning, n8n's open backlog gets re-scored by leverage." |
| 10–25 | Workflow canvas ranking (Schedule → GitHub → Code → Data Table) | "Native GitHub node, my formula, upsert top 25. Dogfooding n8n." |
| 25–50 | Chat Copilot — type "What MCP issues hurt most?" | "Ask the backlog. Vector search on 427 issues plus live ranking." |
| 50–70 | Réponse agent avec liens GitHub | "It answers like a community engineer would — issues, scores, links." |
| 70–85 | PR #33785 diff (headers in McpTrigger) | "And I contribute upstream — MCP headers, tests green." |
| 85–90 | Logo / lien repo | "Repo + workflows in description." |

**Enregistrement :** Loom ou QuickTime screen capture. Pas besoin de face cam.

---

## Liens à envoyer à Ryan

| Artefact | URL |
|----------|-----|
| Repo leverage | https://github.com/guillaume-flambard/n8n-community-leverage |
| PR n8n | https://github.com/n8n-io/n8n/pull/33785 |
| n8n instance | https://n8n.phangan.ai (chat copilot si accès donné) |

---

## Workflows n8n (IDs prod)

| Workflow | ID | Rôle |
|----------|-----|------|
| Community Leverage — ranking | `LvgRank0000000001` | Daily top-25 |
| Leverage Copilot | `XtV6NerjQnYPtXgz` | Chat RAG |
| Index bootstrap | `KOJmzKxRR0T3l6eF` | Re-index après restart |
| Ranking tool | `s2bX3oDLRPUamt0M` | Sub-workflow agent |
| Error handler | `G8zsc6ebrw5ZZBiz` | Discord alerts |
