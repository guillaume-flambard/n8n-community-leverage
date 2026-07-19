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

## CRITICAL: Switch to OpenRouter (DO THIS BEFORE DEMO)

Ollama on CPU = 2+ minutes per response. Unusable for live demo.
The VPS also runs Echo Travel — Ollama eats its RAM/CPU.

### Step 1: Add credits to OpenRouter

1. Go to https://openrouter.ai/credits
2. Add $5 (enough for hundreds of demo queries)

### Step 2: Switch the copilot LLM back to OpenRouter

In n8n editor, workflow "Leverage Copilot — ask the backlog":

1. Click node **"OpenRouter Chat Model"** (it's actually Ollama right now despite the name)
2. Change type back to: `Chat OpenRouter` (or HTTP Request to OpenRouter API)
3. Model: `google/gemini-flash-1.5` (fast + cheap) or `meta-llama/llama-3.1-8b-instruct`
4. Credential: select your OpenRouter API credential
5. Save + Publish (Ctrl+S, then click "Save" on the orange dot)

### Step 3: Switch the deep dive synthesis to OpenRouter

Workflow "Leverage — issue deep dive tool" (`KjC9Bq8HnsxwyRpg`):

1. Open the **"Synthesize and propose"** Code node
2. Replace the Ollama API calls:

**Current (Ollama):**
```javascript
const synth = await this.helpers.httpRequest({
  method: 'POST',
  url: 'http://10.0.0.2:11434/api/chat',
  body: { model: 'qwen2.5:7b', messages: [...], stream: false },
  json: true,
});
const synthResponse = synth.message?.content || '';
```

**Replace with (OpenRouter):**
```javascript
const synth = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://openrouter.ai/api/v1/chat/completions',
  headers: {
    'Authorization': 'Bearer ' + $env.OPENROUTER_API_KEY,
    'Content-Type': 'application/json',
  },
  body: {
    model: 'google/gemini-flash-1.5',
    messages: [{ role: 'user', content: synthPrompt }],
  },
  json: true,
});
const synthResponse = synth.choices?.[0]?.message?.content || '';
```

Same change for the proposal call below it.

3. Save + Publish

### Step 4: Test

```bash
ssh ovh-echo 'curl -s -X POST "http://localhost:5678/webhook/leverage-copilot" \
  -H "Content-Type: application/json" \
  -d "{\"chatInput\":\"Hello\"}" --max-time 30'
```

Should respond in 2-5 seconds now.

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

## Tool status (current)

| Tool | Status | Notes |
|------|--------|-------|
| issue_search | OK | Vector store (in-memory), no GitHub dependency |
| top_ranking | OK | Data Table, no GitHub dependency |
| top_prs | OK | Data Table, no GitHub dependency |
| fetch_comments | OK | Unauthenticated, 60 req/hour |
| issue_deep_dive | OK | Unauthenticated + Ollama synthesis |
| issue_pr_linker | OK | Unauthenticated search API |
| code_scout | BROKEN | Needs valid PAT (GitHub code search requires auth) |

---

## Demo checklist (day of interview)

- [ ] Add OpenRouter credits ($5)
- [ ] Switch copilot + deep dive back to OpenRouter (see above)
- [ ] Regenerate GitHub PAT (fixes code_scout + higher rate limits)
- [ ] Run bootstrap workflow (vector store reload) if VPS was restarted
- [ ] Test from editor Chat panel: "Why is #14361 ranked first?"
- [ ] Test deep dive: "Deep dive #14361"
- [ ] Test fetch_comments: "Show comments on #14361"
- [ ] Verify response time < 10 seconds
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
