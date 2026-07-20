# Leverage Copilot — Operations Guide

Everything you need to run, fix, and demo the copilot.

---

## Architecture (what talks to what)

```
[You / Discord / curl]
        |
        v
  n8n Webhook (POST /webhook/leverage-copilot)
        |
        v
  Map Input (normalizes chatInput + sessionId)
        |
        v
  Read Ranking (DataTable DCl7YFpc6jt8BUoV, 46 rows)
  Read PRs     (DataTable oDeIzAGk6lMrJeY4)
        |  (parallel)
        v
  Router (Code node — builds system prompt with data,
          detects "deep dive #N" → specialized prompt)
        |
        v
  Groq Chat (HTTP Request → api.groq.com, llama-3.1-8b-instant)
        |
        v
  Format Response (extracts output, handles 429 fallback)
```

**VPS**: ovh-echo (`n8n.phangan.ai`)
**n8n container**: `docker run` (NOT docker-compose), network=host, volume=n8n_data
**LLM**: Groq free tier via credential `Groq (free tier)` (ID: WScor4TELbr5bEwC)
**Model**: `llama-3.1-8b-instant`

### Discord relay

Workflow `xjeeK7tbTK9yAAY9` — polls #copilot every 8s:
1. Get recent messages (Discord HTTP Request)
2. Filter: skip bots, skip already-processed (BigInt comparison), seed on first run (`seeded_v2`)
3. Update `lastMessageId` in staticData BEFORE calling copilot (prevents concurrent re-processing)
4. POST to `/webhook/leverage-copilot`
5. Reply in Discord with `$json.output`

Bot: `blueowl-mcp#7243` (credential ID: PGiepxjmskvm0GUB)
Channel: #copilot `1528360422279745568`
Guild: `1070165279537102911`

---

## Workflow IDs

| Workflow | ID | Role | Status |
|----------|----|------|--------|
| Leverage Copilot — ask the backlog | `XtV6NerjQnYPtXgz` | LLM chat + deep dive | ACTIVE |
| Leverage — Discord copilot relay | `xjeeK7tbTK9yAAY9` | Discord poll → webhook → reply | ACTIVE |
| Leverage — issue deep dive tool | `KjC9Bq8HnsxwyRpg` | Sub-workflow (disconnected, replaced by LLM prompt) | ACTIVE but unused |
| Leverage — index bootstrap | `KOJmzKxRR0T3l6eF` | Vector store reload | NOT NEEDED (DataTables replaced vector store) |

---

## How to test

### From Discord (production path)

Send a message in #copilot as a user (not as bot). Examples:
- `top 5 issues`
- `quelles issues touchent l'AI Agent ?`
- `deep dive #14361`
- `list PRs`

Response arrives in ~10s (8s poll + 2-5s LLM).

### From curl (webhook direct)

```bash
curl -s -X POST "https://n8n.phangan.ai/webhook/leverage-copilot" \
  -H "Content-Type: application/json" \
  -d '{"chatInput":"top 5 issues","sessionId":"test"}' \
  --max-time 30
```

Response in 2-5s.

### From n8n editor

Open workflow "Leverage Copilot — ask the backlog" → use "Test workflow" with webhook trigger.

---

## Groq free tier limits

| Limit | Value |
|-------|-------|
| Requests/day | 14,400 |
| Requests/min | 30 |
| **Tokens/min (TPM)** | **6,000** (main constraint) |
| Tokens/request (copilot) | ~1,700 |
| Max requests/min (practical) | ~3-4 |

**Rule for demo**: space requests by ~15-20s.

### Rate limit behavior

Groq Chat node has `neverError: true`. On 429, Format Response returns:
`"⏳ Limite Groq atteinte — reessaie dans 10s."`

No workflow crash, no "No response." spam.

### Performance (tested 2026-07-19)

| Query type | Response time |
|-----------|--------------|
| Simple chat | 2-3s |
| Top N issues/PRs | 2-3s |
| Deep dive | 4-5s |
| Rate limit fallback | 1-2s |

---

## Router logic

The Router Code node has two modes:

### Deep dive (pattern detected)
Regexes: `deep dive #N`, `analyse approfondie #N`, `plonge dans #N`, `explique #N`

Builds a specialized prompt with the issue metadata from the ranking table (leverage, reactions, comments, title). Asks the LLM for: impact analysis, risks, contribution strategy, attention points.

### General chat (everything else)
Injects top 10 issues + top 10 PRs into system prompt. LLM answers any natural language question about the backlog.

PR deduplication: Set-based filter by `number` (fixes parallel DataTable read duplication).

---

## DataTables (persistent, no bootstrap needed)

| Table | ID | Content | Updated by |
|-------|----|---------|-----------|
| leverage_ranking | `DCl7YFpc6jt8BUoV` | 46 issues scored by leverage | Daily ranking workflow |
| leverage_prs | `oDeIzAGk6lMrJeY4` | Community PRs scored | Daily ranking workflow |

DataTables survive container restarts. No vector store, no bootstrap workflow needed.

---

## After VPS restart

1. Verify n8n is running: `ssh ovh-echo 'docker ps | grep n8n'`
2. Verify workflows active: check `XtV6NerjQnYPtXgz` and `xjeeK7tbTK9yAAY9`
3. DataTables are persistent — no action needed
4. The relay will re-seed on first poll (`seeded_v2` flag in staticData survives restarts)

If SQLite WAL error:
```bash
chmod 666 /var/lib/docker/volumes/n8n_data/_data/database.sqlite-{shm,wal}
```

---

## Disconnected/legacy nodes (still in workflow, not in active flow)

These nodes exist in the copilot workflow but are NOT connected to the active path:

| Node | Type | Status |
|------|------|--------|
| AI Agent | langchain.agent | Disconnected from webhook flow |
| Chat Trigger | langchain.chatTrigger | Connected to AI Agent (editor chat only) |
| OpenRouter Chat Model | lmChatOpenAi | Connected to AI Agent |
| Simple Memory | memoryBufferWindow | Disabled |
| Issue search | vectorStoreInMemory | Connected to AI Agent |
| Embeddings Ollama | embeddingsOllama | Connected to Issue search |
| top_ranking, top_prs | toolWorkflow | Connected to AI Agent |
| fetch_comments, issue_pr_linker, code_scout | toolWorkflow | Disabled |
| issue_deep_dive | toolWorkflow | Connected to AI Agent |

These can be removed for cleanup but don't affect the active flow.

---

## Known issues

### GitHub PAT expired
Token `GitHub (guillaume-flambard)` is expired. Only affects `code_scout` (disconnected) and rate limits on sub-workflows (also disconnected). The active flow does NOT use GitHub API.

**To fix**: Generate fine-grained PAT → n8n-io/n8n read-only → update credential in n8n Settings.

### Groq TPM ceiling
6000 TPM means ~3-4 requests/minute. Not a problem for normal use. For demo, space questions by 15-20s.

### Read Ranking → Read PRs legacy connection
A stale connection from Read Ranking to Read PRs still exists (MCP removeConnection bug). Causes Read PRs to run 47 times instead of once. Mitigated by Set-based dedup in Router. No functional impact.

---

## Env vars on n8n container

```
WEBHOOK_URL=https://n8n.phangan.ai
N8N_ENCRYPTION_KEY=<set>
```

Container started with: `docker run` (see memory file for full command).
NEVER use `docker compose up` — would break the instance.

---

## If you need to switch LLM provider

1. Create new credential (type: openAiApi) with provider's base URL
2. Update "Groq Chat" node: credential reference + model name in jsonBody
3. Test: `curl -X POST https://n8n.phangan.ai/webhook/leverage-copilot -H "Content-Type: application/json" -d '{"chatInput":"Hello"}' --max-time 30`

---

## Export des workflows (à refaire après chaque modif prod)

`workflows/leverage-copilot-workflow.json` est un export manuel. Il ne se met pas à jour
tout seul quand le workflow change sur `n8n.phangan.ai`.

**À jour au 2026-07-20** (langue anglaise par défaut, regex deep dive élargi, refus hors
classement, disclaimer ajouté dans Format Response).

Pour le régénérer : ouvrir le workflow dans l'UI n8n, menu `...` en haut à droite,
`Download`, puis remplacer le fichier et ne garder que les clés `id`, `name`, `nodes`,
`connections`, `settings`.

En ligne de commande, l'API REST derrière le proxy rejette les requêtes sans User-Agent
navigateur (403). Il faut envoyer `X-N8N-API-KEY` **et** un User-Agent classique.

L'export ne contient aucun secret : les nœuds utilisent `predefinedCredentialType`, donc
seules les références de credentials sortent, jamais les clés. Revérifier après chaque
ajout de nœud HTTP Request qui porterait un token en dur dans les headers.

À faire avant d'envoyer le lien du repo à un recruteur : le repo est un artefact de
candidature, il doit refléter ce que la démo montre.
