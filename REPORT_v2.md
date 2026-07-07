# n8n Community Leverage Report — v2 (semantic clustering)

_Local embeddings (nomic-embed-text via ollama), fixed 2026-07-07 clock. Nothing leaves the machine._

**Backlog:** 427 open issues embedded and clustered by meaning.

**Dedup result:** 427 issues collapse into **139 themes** (76 multi-issue clusters covering 364 issues; 63 singletons). v1 keyword buckets left ~39% in "Other" — semantic clustering removes that bucket entirely.

## Top themes by aggregate leverage

| # | Theme (auto-named) | Issues | Σ👍 | Σ leverage | % total |
|---|---|---:|---:|---:|---:|
| 1 | agent / tool / memory | 18 | 51 | 74.8 | 10% |
| 2 | queue | 19 | 2 | 36.2 | 5% |
| 3 | oauth / mcp / oauth2 | 17 | 2 | 29.4 | 4% |
| 4 | trigger / imap | 13 | 8 | 28.4 | 4% |
| 5 | mcp / server / client | 13 | 3 | 26.9 | 4% |
| 6 | npm / install | 7 | 4 | 23.1 | 3% |
| 7 | timeout / database | 5 | 12 | 22.6 | 3% |
| 8 | credential / credentials / regression | 8 | 5 | 17.8 | 2% |
| 9 | workflows | 13 | 1 | 16.8 | 2% |
| 10 | Green arrow following the flow activity  | 10 | 0 | 16.1 | 2% |
| 11 | response / teams / send | 6 | 2 | 15.9 | 2% |
| 12 | webhook | 13 | 2 | 14.8 | 2% |
| 13 | data / table | 9 | 7 | 14.5 | 2% |
| 14 | schedule / trigger / activation | 4 | 6 | 14.4 | 2% |
| 15 | nodes / execution | 10 | 3 | 13.9 | 2% |

## Inside the leading themes (one fix retires the whole cluster)

**agent / tool / memory** — 18 issues, Σlev 74.8, 51👍
- [#14361](https://github.com/n8n-io/n8n/issues/14361) AI Agent doesn't store the Tool usages in memory — 33👍 50💬 lev 16.78
- [#24042](https://github.com/n8n-io/n8n/issues/24042) AI Agent node: Tool node errors fail workflow instead of returning error to agent for handling — 7👍 15💬 lev 9.76
- [#29119](https://github.com/n8n-io/n8n/issues/29119) [Bug] DeepSeek AI Agent node fails with 400 "Missing reasoning_content" when using tools with thinking mode (deepseek-v4-flash) — 6👍 9💬 lev 6.65
- [#20335](https://github.com/n8n-io/n8n/issues/20335) Claude 4.5 failing due to Postgres AI Memory Bug (Empty AI Message) — 2👍 15💬 lev 6.07
- [#26352](https://github.com/n8n-io/n8n/issues/26352) LLM responses with mixed text + tool_use content blocks are silently dropped — 1👍 8💬 lev 4.62

**queue** — 19 issues, Σlev 36.2, 2👍
- [#19877](https://github.com/n8n-io/n8n/issues/19877) RabbitMQ Trigger stops consuming messages intermittently in n8n 1.111.1 (requires manual workflow restart) — 1👍 5💬 lev 5.73
- [#31837](https://github.com/n8n-io/n8n/issues/31837) Webhook trigger firing multiple times — 0👍 10💬 lev 3.57
- [#33613](https://github.com/n8n-io/n8n/issues/33613) HTTP Request node hangs (ECONNABORTED, 0 packets sent) for some hosts while curl/wget from the same container reach them — 0👍 3💬 lev 3.31
- [#32509](https://github.com/n8n-io/n8n/issues/32509) 2.27.0 regression: waiting webhook resume returns 404 in queue mode when parent has saveDataSuccessExecution: none — 0👍 4💬 lev 3.3
- [#19266](https://github.com/n8n-io/n8n/issues/19266) Output Parser Randomly Failing After Most Recent Update - Function Calling Errors — 0👍 5💬 lev 2.73

**oauth / mcp / oauth2** — 17 issues, Σlev 29.4, 2👍
- [#30875](https://github.com/n8n-io/n8n/issues/30875) MCP OAuth2 authentication is not automatically refreshed by n8n — 0👍 6💬 lev 4.09
- [#32278](https://github.com/n8n-io/n8n/issues/32278) Cannot register local n8n mcp with my claude desktop connector — 0👍 6💬 lev 3.82
- [#30147](https://github.com/n8n-io/n8n/issues/30147) MCP OAuth/DCR incorrectly adds scope=openid for Calendly MCP — 0👍 8💬 lev 3.26
- [#32421](https://github.com/n8n-io/n8n/issues/32421) Salesforce OAuth not working properly — 1👍 1💬 lev 3.16
- [#27228](https://github.com/n8n-io/n8n/issues/27228) openAI Node error 401: Authorization failed — 0👍 8💬 lev 2.64

**trigger / imap** — 13 issues, Σlev 28.4, 8👍
- [#12583](https://github.com/n8n-io/n8n/issues/12583) [IMAP Trigger Node] Does not trigger on new mails in custom folders (only in test mode) but with INBOX — 2👍 17💬 lev 5.41
- [#33539](https://github.com/n8n-io/n8n/issues/33539) After upgrading to 2.28.6, the Agent's calls to sub-workflows consistently return node data from the trigger instead of the data from the final node. — 0👍 6💬 lev 3.89
- [#29633](https://github.com/n8n-io/n8n/issues/29633) Telegram Trigger node is not working in my self-hosted n8n instance — 0👍 3💬 lev 3.34
- [#33052](https://github.com/n8n-io/n8n/issues/33052) Email Trigger IMAP broken — 0👍 4💬 lev 3.34
- [#33502](https://github.com/n8n-io/n8n/issues/33502) n8n Forms - Email Field Validation Bug? — 0👍 1💬 lev 2.23

**mcp / server / client** — 13 issues, Σlev 26.9, 3👍
- [#30926](https://github.com/n8n-io/n8n/issues/30926) MCP Server Trigger discards incoming request headers, unlike Webhook Trigger — 1👍 8💬 lev 5.77
- [#27232](https://github.com/n8n-io/n8n/issues/27232) Glitch when pulling workflow with HTTP Node — 0👍 12💬 lev 4.41
- [#24967](https://github.com/n8n-io/n8n/issues/24967) [MCP Client] Transport selection dropdown ignored - causes 95M failed requests retry storm — 1👍 8💬 lev 3.34
- [#33512](https://github.com/n8n-io/n8n/issues/33512) MCP Client Tool v1.4 wraps Playwright MCP args in `value`, breaking browser_navigate — 0👍 2💬 lev 2.78
- [#31328](https://github.com/n8n-io/n8n/issues/31328) [MCP SDK] create_workflow_from_code intermittently returns HTTP 500, often as a false negative (workflow persists anyway, causing duplicates on retry) — 0👍 2💬 lev 2.23

**npm / install** — 7 issues, Σlev 23.1, 4👍
- [#28572](https://github.com/n8n-io/n8n/issues/28572) 2.15.1 → 2.16.1: Failed to load module "breaking-changes" — 4👍 8💬 lev 8.24
- [#24556](https://github.com/n8n-io/n8n/issues/24556) Code node "Unknown error" after updating to n8n v2 — 0👍 14💬 lev 4.72
- [#27067](https://github.com/n8n-io/n8n/issues/27067) NPM build of N8N does not honour overrides and patches — 0👍 6💬 lev 3.77
- [#31149](https://github.com/n8n-io/n8n/issues/31149) ## Bug: Python Task Runner fails on native npm install — `src/` folder missing from published package — 0👍 2💬 lev 2.74
- [#33582](https://github.com/n8n-io/n8n/issues/33582) n8n-node: Can't start local custom node project with n8n-node dev (ubuntu) — 0👍 1💬 lev 2.37

**timeout / database** — 5 issues, Σlev 22.6, 12👍
- [#25705](https://github.com/n8n-io/n8n/issues/25705) Unsupported startup parameter in options: statement_timeout — 4👍 11💬 lev 9.02
- [#25360](https://github.com/n8n-io/n8n/issues/25360) Timeout setting does not work for Ollama node when it takes more than 5 minutes — 8👍 9💬 lev 6.96
- [#26199](https://github.com/n8n-io/n8n/issues/26199) Oracle Database node version 1 (Latest) timeout does not go to the error path — 0👍 6💬 lev 4.12
- [#30872](https://github.com/n8n-io/n8n/issues/30872) bug: All database credentials fail after v2.20.12 (works fine when downgraded to 2.20.12) — 0👍 5💬 lev 1.8
- [#19943](https://github.com/n8n-io/n8n/issues/19943) n8n v1.107.3 upgrade to v1.108.2 database migration process error with PostgreSQL — 0👍 6💬 lev 0.74

**credential / credentials / regression** — 8 issues, Σlev 17.8, 5👍
- [#27918](https://github.com/n8n-io/n8n/issues/27918) Unable to select existing credentials in new nodes after updating to 2.14.2 — 2👍 6💬 lev 4.63
- [#32954](https://github.com/n8n-io/n8n/issues/32954) dynamic credentials can no longer be shared with other users — breaks per-user/OBO auth pattern (regression from #31644) — 0👍 11💬 lev 4.03
- [#32039](https://github.com/n8n-io/n8n/issues/32039) Credential "Set up credential" button missing for child credentials with empty properties[] (regression from #30200) — 0👍 3💬 lev 2.16
- [#32241](https://github.com/n8n-io/n8n/issues/32241) JWT Salesforce credential does not appear in Salesforce trigger node — 0👍 2💬 lev 2.05
- [#27160](https://github.com/n8n-io/n8n/issues/27160) Git integration resets non-default credential option values (custom credentials) — 0👍 3💬 lev 1.92

---

### Method
- **Local embeddings:** each issue (title + body) embedded with `nomic-embed-text` via ollama. No API key, no network egress, no external DB — the vector store is in-process.
- **Greedy clustering:** issues sorted by leverage seed clusters; each subsequent issue joins the nearest centroid above cosine 0.74, else starts a new theme. Themes are auto-named from salient shared title terms.
- **Production seam:** the same normalized vectors drop into pgvector unchanged; greedy clustering becomes an ANN query. Threshold 0.74 is tunable per desired granularity.
