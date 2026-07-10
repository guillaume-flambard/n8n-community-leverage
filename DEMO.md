# Leverage Engine — Demo Script

## 60-second pitch (async / intro call)

> I don't just prioritize n8n's backlog — I turn it into contributions.
>
> I built a leverage scorer across 427 open issues, clustered them into 139 themes,
> and found the top pain is **AI Agent / tool / memory** — right in n8n's mission.
>
> It runs daily as an n8n workflow on my VPS: GitHub node → leverage formula → Data Tables
> (issues + community PRs). The **chat copilot** reads comment threads, synthesizes maintainer
> signals, and proposes contributor scope — plus a real [PR #33785](https://github.com/n8n-io/n8n/pull/33785).

---

## Live demo (5 min screen share)

### Acte 1 — Preuve prod (30 sec)

1. Ouvrir https://n8n.phangan.ai (ou tunnel SSH)
2. **Data tables** → `leverage_ranking` et `leverage_prs`
3. Montrer #14361 en tête, colonne `leverage`, `scoredAt` d'aujourd'hui
4. Phrase : *"Ça tourne tous les matins à 8h, issues et PRs community, sans intervention."*

### Acte 2 — Chat Copilot (2 min)

1. Workflow **Leverage Copilot — ask the backlog** → onglet **Chat**
2. *"Why is #14361 ranked first?"* → `top_ranking` + contexte
3. *"What MCP issues hurt most right now?"* → `issue_search`
4. **Acte 2 bis — deep dive** : *"Deep dive #14361 — what are maintainers saying and what would you contribute?"*
   → `issue_deep_dive` (lit les commentaires, synthèse + proposition de scope)
5. Optionnel : *"Find PRs linked to #14361"* → `issue_pr_linker`
6. Phrase : *"Un agent, sept tools — vector search, ranking live, commentaires GitHub, deep-dive LLM."*

> Si le vector store est vide (après restart n8n) : exécuter une fois
> **Leverage — index bootstrap (run once)** (~6 min, 442 docs issues + PRs).
>
> **Setup du fichier de bootstrap :**
> ```bash
> # Copier le fichier de vecteurs dans le volume Docker n8n
> docker cp data/vector_documents.json n8n:/home/node/.n8n/leverage_docs.json
> ```

### Acte 3 — Contribution code (1 min)

1. [PR #33785](https://github.com/n8n-io/n8n/pull/33785) — MCP headers
2. Phrase : *"Le copilot propose le scope ; quand je suis convaincu, j'ouvre une PR avec tests."*

### Questions de secours si le chat est lent

Réponses pré-écrites depuis [BRIEFS.md](BRIEFS.md) thème **agent / tool / memory**.

---

## Loom 90 sec — storyboard

| Sec | Visuel | Voix off |
|-----|--------|----------|
| 0–10 | Data Tables `leverage_ranking` + `leverage_prs`, #14361 | "Every morning, issues and community PRs get re-scored by leverage." |
| 10–25 | Workflow canvas ranking (Schedule → GitHub → Code → Data Table) | "Native GitHub node, my formula, upsert top 25 + top 15 PRs." |
| 25–45 | Chat — "What MCP issues hurt most?" | "Semantic search on 442 indexed items plus live ranking." |
| 45–65 | Chat — "Deep dive #14361" | "It reads the thread, summarizes maintainer signals, proposes a fix scope." |
| 65–80 | PR #33785 diff (headers in McpTrigger) | "And I contribute upstream — MCP headers, tests green." |
| 80–90 | Logo / lien repo | "Repo + workflows in description." |

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
| Community Leverage — ranking | `LvgRank0000000001` | Daily top-25 issues + top-15 PRs |
| Leverage Copilot | `XtV6NerjQnYPtXgz` | Chat + 7 tools |
| Index bootstrap | `KOJmzKxRR0T3l6eF` | Re-index 442 docs après restart |
| Ranking tool | `s2bX3oDLRPUamt0M` | Sub-workflow top issues |
| PR ranking tool | `ErItT8BHutyTa0rf` | Sub-workflow top PRs |
| Fetch comments | `8vGd2e5vuyAi0u0V` | Thread GitHub on-demand |
| Issue deep dive | `KjC9Bq8HnsxwyRpg` | Synthèse + proposition contributeur |
| Issue PR linker | `wzKasDRdfp8VgUI7` | PRs liées à une issue |
| Code scout | `hnt00MJVcSNedoZf` | Recherche chemins dans le repo (read-only) |
| Error handler | `G8zsc6ebrw5ZZBiz` | Discord alerts |

---

## Phrase pitch mise à jour

> *"Le copilot ne cherche pas juste des issues — il lit les threads, synthétise ce que la communauté et les maintainers disent, et propose un scope de contribution. Et quand je suis convaincu, j'ouvre une PR — comme #33785."*
