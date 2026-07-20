# Leverage Engine — Demo Script

## 60-second pitch (async / intro call)

> I don't just prioritize n8n's backlog — I turn it into contributions.
>
> I built a leverage scorer across 46 open issues and community PRs,
> running daily as n8n workflows on my VPS. The **chat copilot** runs on
> Groq (free tier), reads DataTables live, and answers in natural language
> via Discord — deep dives, comparisons, rankings, all in 3 seconds.
>
> Plus a real [PR #33785](https://github.com/n8n-io/n8n/pull/33785).

---

## Live demo (5 min screen share)

### Acte 1 — Preuve prod (30 sec)

1. Ouvrir https://n8n.phangan.ai
2. **Data Tables** → `leverage_ranking` (46 issues) et `leverage_prs`
3. Montrer #14361 en tête, colonne `leverage`, `scoredAt` d'aujourd'hui
4. Phrase : *"Ça tourne tous les matins à 8h, issues et PRs community, sans intervention."*

### Acte 2 — Discord live (2 min)

> **Démo en ANGLAIS.** n8n est une boîte internationale, l'entretien se fera en anglais.
> Le copilot répond en anglais par défaut et bascule en français seulement si la question
> est clairement française. Tape tes questions en anglais.

1. Ouvrir Discord **#copilot**
2. Taper en live : *"what are the 5 most critical issues?"*
   → réponse en ~3s, classement avec scores leverage, titres d'issues en anglais
3. *"any PRs related to the AI Agent?"*
   → le LLM filtre et analyse les données en contexte
4. **Deep dive** : *"deep dive #14361"*
   → 4 sections : what the signal says, product area, questions to investigate, likely effort
5. Phrase : *"Natural language, English or French, live backlog data, three seconds."*

> **Si tu veux montrer le bilingue** (10s) : repose la même question en français, le bot
> suit. Attention, sur le chemin français il retraduit les titres d'issues et perd parfois
> les scores `lev=`. À montrer seulement si tu as le temps, jamais comme démo principale.

> **Timing** : espacer ~15-20s entre les questions (Groq free tier = 6000 TPM).
> Si rate limit, le bot affiche "⏳ reessaie dans 10s" (pas de crash).

> **Bonus si tu veux marquer un point (30s).** Tape une issue hors classement, par exemple
> *"deep dive #14362"*. Le copilot refuse proprement, explique que le classement ne couvre
> que les issues rescorées chaque matin, et propose les 3 mieux classées à la place.
>
> Phrase : *"Il connaît sa frontière. Il ne fabrique pas une analyse quand il n'a pas la
> donnée, il te redirige vers ce qu'il sait."*
>
> C'est plus convaincant qu'une réponse réussie de plus, parce que c'est le comportement
> qu'on n'obtient jamais par accident.

> **Cadrage du deep dive.** Le copilot lit le classement, pas le corps de l'issue ni les
> commentaires. Le prompt lui interdit d'inventer une cause technique, et la réponse se
> termine par *"Analyse basée sur le signal du backlog, pas sur le contenu de l'issue."*
>
> Assume-le à voix haute, c'est un argument et pas une excuse :
> *"Il propose où creuser à partir du signal. Il ne prétend pas avoir lu l'issue. Je préfère
> un outil qui dit ce qu'il ignore, sinon je ne peux pas lui faire confiance sur le reste."*
>
> Ne t'appuie pas sur la ligne `idleDays` : le modèle interprète parfois 4 jours comme
> "relativement ancienne", ce qui est faux.

> **Si on te demande pourquoi le workflow copilot contient des nœuds désactivés.**
> C'est l'architecture précédente : un AI Agent LangChain avec 7 tools. Les définitions de
> tools consommaient à elles seules plus de 5000 tokens, contre une limite Groq de 6000 par
> minute. Remplacé par une injection directe des données dans le prompt, ~1700 tokens par
> requête. Désactivés plutôt que supprimés pour garder la comparaison. C'est une bonne
> histoire à raconter, pas quelque chose à cacher.

### Acte 3 — Contribution code (1 min)

1. [PR #33785](https://github.com/n8n-io/n8n/pull/33785) — MCP headers
2. Phrase : *"Le copilot propose le scope ; quand je suis convaincu, j'ouvre une PR avec tests."*

### Questions de secours si rate limit

Réponses pré-écrites depuis [BRIEFS.md](BRIEFS.md) thème **agent / tool / memory**.

---

## Architecture (ce qui tourne)

```
Discord #copilot
  |  (poll 8s)
  v
Relay (xjeeK7tbTK9yAAY9) → filtre bot/seed → update lastMessageId
  |
  v  POST /webhook/leverage-copilot
Copilot (XtV6NerjQnYPtXgz)
  Webhook → Map Input → Read Ranking + Read PRs (DataTables)
                       → Router (prompt builder, deep dive detect)
                       → Groq Chat (llama-3.1-8b-instant, free tier)
                       → Format Response → webhook reply
  |
  v
Relay → bot.reply() dans Discord
```

Zero vector store. Zero Ollama. Zero outils LangChain.
Données lues depuis DataTables (persistant), LLM via Groq free tier.

---

## Loom 90 sec — storyboard

| Sec | Visuel | Voix off |
|-----|--------|----------|
| 0–10 | Data Tables `leverage_ranking` + `leverage_prs`, #14361 | "Every morning, issues and community PRs get re-scored by leverage." |
| 10–25 | Workflow canvas ranking (Schedule → GitHub → Code → Data Table) | "Native GitHub node, my formula, upsert to DataTables." |
| 25–45 | Discord — "quelles sont les 5 issues les plus critiques ?" | "Natural language, French or English, 3 seconds via Groq." |
| 45–65 | Discord — "deep dive #14361" | "Structured analysis: impact, risks, contribution strategy." |
| 65–80 | PR #33785 diff (headers in McpTrigger) | "And I contribute upstream — MCP headers, tests green." |
| 80–90 | Logo / lien repo | "Repo + workflows in description." |

---

## Liens à envoyer à Ryan

| Artefact | URL |
|----------|-----|
| Repo leverage | https://github.com/guillaume-flambard/n8n-community-leverage |
| CI pipeline | https://github.com/guillaume-flambard/n8n-community-leverage/actions |
| PR n8n | https://github.com/n8n-io/n8n/pull/33785 |
| n8n instance | https://n8n.phangan.ai |

---

## Workflows n8n (IDs prod)

| Workflow | ID | Rôle | Statut |
|----------|----|------|--------|
| Leverage Copilot — ask the backlog | `XtV6NerjQnYPtXgz` | LLM chat + deep dive | ACTIF |
| Leverage — Discord copilot relay | `xjeeK7tbTK9yAAY9` | Poll Discord → webhook → reply | ACTIF |
| Community Leverage — ranking | schedule daily | Daily scoring issues + PRs → DataTables | ACTIF |
| Leverage — issue deep dive tool | `KjC9Bq8HnsxwyRpg` | Sub-workflow (déconnecté, remplacé par prompt LLM) | INACTIF |

---

## Phrase pitch mise à jour

> *"Le copilot lit le backlog en temps réel — 46 issues et PRs scorées par leverage, réponses en 3 secondes dans Discord, en langage naturel. Deep dives, comparaisons, classements. Et quand le scope est clair, j'ouvre une PR — comme #33785."*
