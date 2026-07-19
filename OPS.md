# Leverage Copilot — Operations Guide

Everything you need to run, fix, and demo the copilot. Written so you can follow it
even half-asleep at 3am.

---

## Architecture (what talks to what)

```
[You / Discord / curl]
        |
        v
  n8n Webhook (POST /webhook/leverage-copilot)
        |
        v
  Map Input (adds sessionId + action fields)
        |
        v
  AI Agent (qwen2.5:7b via Ollama)
        |
        ├── issue_search (vector store, in-memory)
        ├── top_ranking (sub-workflow)
        ├── top_prs (sub-workflow)
        ├── fetch_comments (sub-workflow)
        ├── issue_deep_dive (sub-workflow → GitHub API + Ollama synthesis)
        ├── issue_pr_linker (sub-workflow)
        └── code_scout (sub-workflow)
```

**VPS**: ovh-echo (`n8n.phangan.ai`)
**n8n container**: `docker run` (NOT docker-compose), network=host, volume=n8n_data
**Ollama container**: `ollama-n8n`, accessible at `http://10.0.0.2:11434` (docker bridge IP)
**Model**: `qwen2.5:7b` (CPU-only, SLOW — see "Switch to OpenRouter" below)

---

## Workflow IDs

| Workflow | ID | Role |
|----------|----|------|
| Leverage Copilot — ask the backlog | `XtV6NerjQnYPtXgz` | Main copilot (AI Agent + tools) |
| Leverage — issue deep dive tool | `KjC9Bq8HnsxwyRpg` | Sub-workflow: GitHub issue synthesis |
| Leverage — index bootstrap | `KOJmzKxRR0T3l6eF` | Loads vector store (run after restart) |

---

## How to test

### From the n8n editor (FASTEST, use for demo)

1. Open https://n8n.phangan.ai
2. Open workflow "Leverage Copilot — ask the backlog"
3. Click the **Chat** tab (bottom panel)
4. Type: `Why is #14361 ranked first?`
5. Wait for response (2-3 min with Ollama CPU, 2-3 sec with OpenRouter)

### From curl (webhook)

```bash
ssh ovh-echo 'curl -s -X POST "http://localhost:5678/webhook/leverage-copilot" \
  -H "Content-Type: application/json" \
  -d "{\"chatInput\":\"Hello\"}" \
  --max-time 180'
```

Important: `--max-time 180` because Ollama on CPU takes 2+ minutes per request.

### From outside (through Cloudflare)

```bash
curl -s -X POST "https://n8n.phangan.ai/webhook/leverage-copilot" \
  -H "Content-Type: application/json" \
  -d '{"chatInput":"Hello"}'
```

Note: Cloudflare may challenge bot requests. Works fine from browsers.

---

## LLM Provider: Groq Free Tier (DONE — switched 2026-07-19)

Ollama on CPU was 2+ min/response. Switched to Groq free tier (llama-3.1-8b-instant).

**Current state**: Both copilot + deep dive use Groq via credential `Groq (free tier)` (ID: WScor4TELbr5bEwC).

### Architecture after switch

- **Copilot LLM** (workflow `XtV6NerjQnYPtXgz`): node "OpenRouter Chat Model" uses `lmChatOpenAi` v1.2 pointing to Groq credential
- **Deep dive** (workflow `KjC9Bq8HnsxwyRpg`): 5-node pipeline using HTTP Request nodes with Groq credential:
  1. "Build Synth Prompt" (Code) — assembles issue + comments into synthesis prompt
  2. "Groq Synthesis" (HTTP Request) — calls Groq with credential auth
  3. "Build Propose Prompt" (Code) — takes synthesis, builds proposal prompt
  4. "Groq Proposal" (HTTP Request) — calls Groq with credential auth
  5. "Format Output" (Code) — combines into final markdown

### Groq free tier limits

- 14,400 requests/day
- 30 requests/min
- **6,000 tokens/min (TPM)** — main constraint for demo
- Wait ~10s between requests to avoid rate limit
- Model: `llama-3.1-8b-instant`

### Performance (tested 2026-07-19)

- End-to-end copilot response: **3.5s**
- Deep dive sub-workflow: **2.3s**
- Groq synthesis call: ~800ms
- Groq proposal call: ~630ms

### If you need to switch to another provider later

1. Create new credential (type: openAiApi) with new provider's base URL
2. Update node "OpenRouter Chat Model" credential reference in copilot workflow
3. Update HTTP Request nodes in deep dive workflow (URL + credential)
4. Test: `curl -X POST https://n8n.phangan.ai/webhook/leverage-copilot -H "Content-Type: application/json" -d '{"chatInput":"Hello"}' --max-time 30`

---

## After VPS restart

1. Fix SQLite WAL permissions (if crash):
   ```bash
   chmod 666 /var/lib/docker/volumes/n8n_data/_data/database.sqlite-{shm,wal}
   ```

2. Recreate sandbox dir:
   ```bash
   docker exec n8n mkdir -p /home/node/.n8n-files
   docker exec n8n cp /home/node/.n8n/leverage_docs.json /home/node/.n8n-files/
   ```

3. Re-run bootstrap (vector store is in-memory, lost on restart):
   - Open workflow "Leverage — index bootstrap" in editor
   - Click "Test Workflow" (takes ~5 min)
   - OR via webhook: `curl -X POST http://localhost:5678/webhook/leverage-bootstrap`

---

## Bugs we fixed (2026-07-18)

### 1. Schema type mismatch on issue_deep_dive

**Symptom**: `{ "output": "" }` or "Invalid input for issue_number"
**Cause**: AI sends strings ("14361"), but schema said `type: "number"`
**Fix**: Changed to `type: "string"` in THREE places:
  - `issue_deep_dive` toolWorkflow node schema (copilot workflow)
  - `$fromAI('issue_number', ..., 'string')` in the same node
  - Execute Workflow Trigger schema in the sub-workflow

### 2. GitHub API returning 404

**Symptom**: Deep dive returns empty, GitHub nodes fail silently
**Cause**: GitHub PAT expired. GitHub returns 404 (not 401!) for bad tokens on public repos.
**Fix**: Replaced `github` nodes with unauthenticated `httpRequest` nodes + `User-Agent: n8n-leverage` header. Works for public repos (60 req/hour limit).

To restore auth (more reliable for demo):
1. Generate new PAT: https://github.com/settings/tokens → Fine-grained → n8n-io/n8n read-only
2. Update credential "GitHub (guillaume-flambard)" in n8n Settings → Credentials
3. Switch HTTP Request nodes back to GitHub nodes (optional, unauthenticated works fine)

### 3. OpenRouter rate limit

**Symptom**: 429 errors, `X-RateLimit-Remaining: 0`
**Cause**: Free tier = 50 requests/day across ALL free models
**Fix**: Switched to Ollama. Permanent fix = add credits (see above).

### 4. Webhook returning empty response

**Symptom**: curl gets empty body, but execution succeeds
**Cause**: `responseMode: "lastNode"` — AI Agent's output field is `output` but webhook
  returned the raw JSON object. Actually worked fine, curl just timed out before response arrived.
**Current state**: Webhook works with `responseMode: "lastNode"`. Response takes 2+ min (Ollama)
  or 2-5 sec (OpenRouter with credits).

### 5. AI Agent crash on webhook input

**Symptom**: Execution fails in 34-61ms
**Cause**: AI Agent needs `sessionId` and `action` fields, not just `chatInput`
**Fix**: Added "Map Input" Set node between Webhook and AI Agent:
  - `chatInput`: `{{ $json.body.chatInput || $json.chatInput }}`
  - `sessionId`: `{{ $json.body.sessionId || 'webhook-' + $now.toMillis() }}`
  - `action`: `"sendMessage"`

### 6. Schema type mismatch on fetch_comments and issue_pr_linker

**Symptom**: "Invalid input for issue_number" (same as bug #1 but on other tools)
**Cause**: Caller schema had `type: "number"` + `$fromAI(..., 'number')`
**Fix**: Changed both to `type: "string"` + `$fromAI(..., 'string')` in copilot workflow.

### 7. Sub-workflows using expired GitHub credential

**Symptom**: `fetch_comments` returns 404, `issue_pr_linker` returns 404
**Cause**: Same expired PAT as bug #2, but in different sub-workflows
**Fix**: Switched both to `authentication: "none"` + `User-Agent: n8n-leverage` header.
  - `fetch_comments` (`8vGd2e5vuyAi0u0V`): GitHub comments node
  - `issue_pr_linker` (`wzKasDRdfp8VgUI7`): Search linked PRs node

### 8. CRITICAL: toolWorkflow v2.2 data path is `$json.query.xxx`

**Symptom**: GitHub Get Issue called with literal `$fromAI(...)` string in URL → 404
**Root cause discovered via execution 279 error data**:

toolWorkflow v2.2 `defineBelow` sends data to `passthrough` triggers as:
```json
{
  "query": { "issue_number": "14361" },                    // ← ACTUAL VALUE
  "issue_number": "{ $fromAI('issue_number', ...) }"       // ← LITERAL EXPRESSION (not evaluated)
}
```

**All sub-workflows MUST use `$json.query.xxx`**, not `$json.xxx`.

**Fix**: Changed ALL 4 sub-workflows to use `.query.` path:
  - `deep_dive` (`KjC9Bq8HnsxwyRpg`): URL + Code node → `$json.query.issue_number`
  - `fetch_comments` (`8vGd2e5vuyAi0u0V`): URL + Code node → `$json.query.issue_number`
  - `issue_pr_linker` (`wzKasDRdfp8VgUI7`): URL + Code node → `$json.query.issue_number`
  - `code_scout` (`hnt00MJVcSNedoZf`): URL + Code node → `$json.query.search_query`

**Rule**: Any new sub-workflow called by toolWorkflow v2.2 with `defineBelow` + `passthrough`
trigger must access inputs via `$json.query.<field_name>`.

### 9. code_scout requires authentication (NOT fixable without PAT)

**Symptom**: GitHub `/search/code` API returns 401 without auth
**Cause**: Unlike other GitHub endpoints, code search REQUIRES authentication.
**Status**: `.query.` path fixed + User-Agent added, but will return 401 until PAT is regenerated.
**Workaround for demo**: Don't use `code_scout` tool, or regenerate PAT first.

---

## Tool status (updated 2026-07-19)

| Tool | Status | Notes |
|------|--------|-------|
| issue_search | OK | Vector store (in-memory), no GitHub dependency |
| top_ranking | OK | Data Table, no GitHub dependency |
| top_prs | OK | Data Table, no GitHub dependency |
| fetch_comments | OK | Unauthenticated, 60 req/hour |
| issue_deep_dive | OK | Unauthenticated + Groq synthesis (2.3s) |
| issue_pr_linker | OK | Unauthenticated search API |
| code_scout | BROKEN | Needs valid GitHub PAT (/search/code requires auth) |

---

## Demo checklist (day of interview — 2026-07-22)

- [x] Switch copilot + deep dive to fast LLM (Groq free tier, done 2026-07-19)
- [x] Fix deep dive Code node → HTTP Request pipeline with credential (done 2026-07-19)
- [x] Test e2e: copilot 3.5s, deep dive 2.3s (done 2026-07-19)
- [ ] Regenerate GitHub PAT (fixes code_scout + higher rate limits)
- [ ] Run bootstrap workflow (vector store reload) if VPS was restarted
- [ ] Test from editor Chat panel: "Why is #14361 ranked first?"
- [ ] Test deep dive: "Deep dive #14361"
- [ ] Test fetch_comments: "Show comments on #14361"
- [ ] Space requests by ~10s (Groq TPM limit = 6000)
- [ ] Avoid using code_scout if PAT not regenerated

---

## Env vars on n8n container

```
WEBHOOK_URL=https://n8n.phangan.ai
N8N_ENCRYPTION_KEY=<set>
OPENROUTER_API_KEY=<set as container env var, never in workflow code>
```

Container started with: `docker run` (see memory file for full command).
NEVER use `docker compose up` — would break the instance.
