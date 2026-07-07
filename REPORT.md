# n8n Community Leverage Report

_Generated on a fixed 2026-07-07 clock over the live open backlog._

**Backlog:** 427 open issues · 1029 open PRs (821 community, review-ready)

Ranking is by **leverage = reach × severity × recency**, not by date. Themes collapse duplicate reports so one fix can retire many.

## 1. Fix these themes first (highest aggregate leverage)

| # | Theme | Issues | Σ reactions | Σ leverage | % of total |
|---|---|---:|---:|---:|---:|
| 1 | Other | 165 | 53 | 246.0 | 32% |
| 2 | AI Agent / LangChain | 56 | 68 | 134.9 | 18% |
| 3 | Webhook / Trigger | 42 | 15 | 81.4 | 11% |
| 4 | MCP | 22 | 16 | 46.1 | 6% |
| 5 | Credentials / OAuth | 23 | 6 | 34.3 | 5% |
| 6 | Execution / Workflow engine | 14 | 4 | 29.0 | 4% |
| 7 | HTTP Request node | 16 | 25 | 28.3 | 4% |
| 8 | Database / Postgres/SQLite | 11 | 5 | 26.0 | 3% |
| 9 | Editor / UI / Canvas | 13 | 9 | 22.1 | 3% |
| 10 | Upgrade / Breaking change | 7 | 18 | 21.8 | 3% |

### Top items inside the leading themes

**Other** — 165 issues, one fix here helps the most:
- [#31279](https://github.com/n8n-io/n8n/issues/31279) CollaborationPane unmounts collaboration store on single-user instances, causing permanent "No network connection" state — 1👍 8💬 lev 6.35
- [#13149](https://github.com/n8n-io/n8n/issues/13149) Need to remove <think></think> from response when using deepseek — 8👍 22💬 lev 6.29
- [#32149](https://github.com/n8n-io/n8n/issues/32149) Security violation detected when import pandas in n8n 2.25 and later version — 1👍 5💬 lev 5.39

**AI Agent / LangChain** — 56 issues, one fix here helps the most:
- [#14361](https://github.com/n8n-io/n8n/issues/14361) AI Agent doesn't store the Tool usages in memory — 33👍 50💬 lev 16.78
- [#24042](https://github.com/n8n-io/n8n/issues/24042) AI Agent node: Tool node errors fail workflow instead of returning error to agent for handling — 7👍 15💬 lev 9.76
- [#25360](https://github.com/n8n-io/n8n/issues/25360) Timeout setting does not work for Ollama node when it takes more than 5 minutes — 8👍 9💬 lev 6.96

**Webhook / Trigger** — 42 issues, one fix here helps the most:
- [#23711](https://github.com/n8n-io/n8n/issues/23711) Schedule trigger permanently drops valid triggers after changing schedule — 6👍 17💬 lev 9
- [#19877](https://github.com/n8n-io/n8n/issues/19877) RabbitMQ Trigger stops consuming messages intermittently in n8n 1.111.1 (requires manual workflow restart) — 1👍 5💬 lev 5.73
- [#12583](https://github.com/n8n-io/n8n/issues/12583) [IMAP Trigger Node] Does not trigger on new mails in custom folders (only in test mode) but with INBOX — 2👍 17💬 lev 5.41

**MCP** — 22 issues, one fix here helps the most:
- [#30926](https://github.com/n8n-io/n8n/issues/30926) MCP Server Trigger discards incoming request headers, unlike Webhook Trigger — 1👍 8💬 lev 5.77
- [#30875](https://github.com/n8n-io/n8n/issues/30875) MCP OAuth2 authentication is not automatically refreshed by n8n — 0👍 6💬 lev 4.09
- [#32278](https://github.com/n8n-io/n8n/issues/32278) Cannot register local n8n mcp with my claude desktop connector — 0👍 6💬 lev 3.82

**Credentials / OAuth** — 23 issues, one fix here helps the most:
- [#32954](https://github.com/n8n-io/n8n/issues/32954) dynamic credentials can no longer be shared with other users — breaks per-user/OBO auth pattern (regression from #31644) — 0👍 11💬 lev 4.03
- [#33218](https://github.com/n8n-io/n8n/issues/33218) Gmail "Send message and wait for response" Approval Links Always Return "Invalid token" — 0👍 4💬 lev 3.33
- [#32421](https://github.com/n8n-io/n8n/issues/32421) Salesforce OAuth not working properly — 1👍 1💬 lev 3.16

## 2. Single issues with the highest leverage

| lev | 👍 | 💬 | age(d) | idle(d) | #/title |
|---:|---:|---:|---:|---:|---|
| 16.78 | 33 | 50 | 460 | 0 | [#14361](https://github.com/n8n-io/n8n/issues/14361) AI Agent doesn't store the Tool usages in memory |
| 9.76 | 7 | 15 | 179 | 8 | [#24042](https://github.com/n8n-io/n8n/issues/24042) AI Agent node: Tool node errors fail workflow instead of returning error to agent for handling |
| 9.02 | 4 | 11 | 144 | 2 | [#25705](https://github.com/n8n-io/n8n/issues/25705) Unsupported startup parameter in options: statement_timeout |
| 9 | 6 | 17 | 189 | 11 | [#23711](https://github.com/n8n-io/n8n/issues/23711) Schedule trigger permanently drops valid triggers after changing schedule |
| 8.24 | 4 | 8 | 82 | 5 | [#28572](https://github.com/n8n-io/n8n/issues/28572) 2.15.1 → 2.16.1: Failed to load module "breaking-changes" |
| 7.74 | 5 | 45 | 173 | 25 | [#24347](https://github.com/n8n-io/n8n/issues/24347) Docker pull fails with "invalid tar header" on layer bc0cdc8ecc2f for versions > 2.3.0 |
| 6.96 | 8 | 9 | 152 | 26 | [#25360](https://github.com/n8n-io/n8n/issues/25360) Timeout setting does not work for Ollama node when it takes more than 5 minutes |
| 6.65 | 6 | 9 | 73 | 25 | [#29119](https://github.com/n8n-io/n8n/issues/29119) [Bug] DeepSeek AI Agent node fails with 400 "Missing reasoning_content" when using tools with thinking mode (deepseek-v4-flash) |
| 6.35 | 1 | 8 | 40 | 1 | [#31279](https://github.com/n8n-io/n8n/issues/31279) CollaborationPane unmounts collaboration store on single-user instances, causing permanent "No network connection" state |
| 6.29 | 8 | 22 | 513 | 39 | [#13149](https://github.com/n8n-io/n8n/issues/13149) Need to remove <think></think> from response when using deepseek |
| 6.07 | 2 | 15 | 277 | 19 | [#20335](https://github.com/n8n-io/n8n/issues/20335) Claude 4.5 failing due to Postgres AI Memory Bug (Empty AI Message) |
| 5.77 | 1 | 8 | 46 | 6 | [#30926](https://github.com/n8n-io/n8n/issues/30926) MCP Server Trigger discards incoming request headers, unlike Webhook Trigger |
| 5.73 | 1 | 5 | 287 | 1 | [#19877](https://github.com/n8n-io/n8n/issues/19877) RabbitMQ Trigger stops consuming messages intermittently in n8n 1.111.1 (requires manual workflow restart) |
| 5.41 | 2 | 17 | 539 | 27 | [#12583](https://github.com/n8n-io/n8n/issues/12583) [IMAP Trigger Node] Does not trigger on new mails in custom folders (only in test mode) but with INBOX |
| 5.39 | 1 | 5 | 25 | 5 | [#32149](https://github.com/n8n-io/n8n/issues/32149) Security violation detected when import pandas in n8n 2.25 and later version |

## 3. Churn risk — popular issues left to rot

_High reach × long-ignored. These quietly burn goodwill._

| risk | 👍 | age(d) | idle(d) | #/title |
|---:|---:|---:|---:|---|
| 83.79 | 23 | 398 | 67 | [#16005](https://github.com/n8n-io/n8n/issues/16005) Bearer Authentication Not Working with HTTP Request Node Pagination |
| 79.8 | 12 | 412 | 103 | [#15553](https://github.com/n8n-io/n8n/issues/15553) MCP Client Tool doesn't work with gemini models |
| 74.55 | 8 | 513 | 39 | [#13149](https://github.com/n8n-io/n8n/issues/13149) Need to remove <think></think> from response when using deepseek |
| 63.18 | 6 | 424 | 103 | [#15240](https://github.com/n8n-io/n8n/issues/15240) Clicking on a folder with N8N_PATH and N8N_EDITOR_BASE_URL set causes 404 |
| 61.95 | 5 | 267 | 103 | [#20701](https://github.com/n8n-io/n8n/issues/20701) Data Tables not visible |
| 58.84 | 6 | 297 | 76 | [#19489](https://github.com/n8n-io/n8n/issues/19489) Breaking issue: Notion Node does not support latest Notion API (2025-09-03) |
| 54.43 | 2 | 463 | 103 | [#14290](https://github.com/n8n-io/n8n/issues/14290) WhatsApp Business Cloud AI tool broken - "Invalid URL" |
| 53.9 | 2 | 273 | 77 | [#20463](https://github.com/n8n-io/n8n/issues/20463) Datatables Node not working |
| 52.2 | 6 | 140 | 64 | [#25852](https://github.com/n8n-io/n8n/issues/25852) Chat UI Error: 'type' must be 'output_text' after second message in conversation |
| 50.95 | 5 | 173 | 25 | [#24347](https://github.com/n8n-io/n8n/issues/24347) Docker pull fails with "invalid tar header" on layer bc0cdc8ecc2f for versions > 2.3.0 |

## 4. Community PRs to review first

_Non-draft, community-authored, ranked by leverage of the work._

| lev | 💬 | idle(d) | #/title |
|---:|---:|---:|---|
| 13.08 | 10 | 6 | [#18067](https://github.com/n8n-io/n8n/issues/18067) feat(Grist Node): Add upsert operation |
| 12.27 | 16 | 0 | [#24151](https://github.com/n8n-io/n8n/issues/24151) feat(HTTP Request Node): Add support for PROPFIND, MKCOL, MOVE, COPY and REPORT methods |
| 10.43 | 9 | 0 | [#29184](https://github.com/n8n-io/n8n/issues/29184) feat(OpenAI Chat Model Node): Add OpenAI account OAuth support |
| 8.49 | 14 | 22 | [#9346](https://github.com/n8n-io/n8n/issues/9346) feat: Add in-reply-to and references to reply emails |
| 7.25 | 9 | 4 | [#29141](https://github.com/n8n-io/n8n/issues/29141) fix(DeepSeek Node): Preserve reasoning_content on tool-calling assistant messages |
| 7.22 | 15 | 0 | [#19638](https://github.com/n8n-io/n8n/issues/19638) fix(cli,ui): add consistent basePath handling for subpath deployments (N8N_PATH) |
| 7.18 | 3 | 8 | [#32343](https://github.com/n8n-io/n8n/issues/32343) feat(core): Stream workflow execution progress chunks |
| 7.13 | 14 | 0 | [#13992](https://github.com/n8n-io/n8n/issues/13992) feat(OpenAI Chat Model Node): Add optional extraBody option |
| 6.8 | 4 | 7 | [#23889](https://github.com/n8n-io/n8n/issues/23889) fix(DataTable Node): Use extractValue to properly resolve data table ID |
| 6.55 | 9 | 18 | [#17926](https://github.com/n8n-io/n8n/issues/17926) feat(ServiceNow Node): Allow connection to custom host |
| 6.43 | 11 | 28 | [#21039](https://github.com/n8n-io/n8n/issues/21039) feat(API): Add optional projectId parameter to credential creation |
| 6.33 | 9 | 2 | [#33157](https://github.com/n8n-io/n8n/issues/33157) fix(editor): Resolve $secrets expressions in credential fixedCollection fields |
| 6.32 | 10 | 39 | [#14024](https://github.com/n8n-io/n8n/issues/14024) implement redis-sentinel |
| 6.21 | 5 | 22 | [#7856](https://github.com/n8n-io/n8n/issues/7856) feat(Crypto Node): Add support for storing secrets as credentials |
| 6.13 | 16 | 0 | [#30205](https://github.com/n8n-io/n8n/issues/30205) feat(Form Trigger Node): Add "Show Headers" option |

---

### Method (why this beats date-sorting and per-issue AI labels)
- **Leverage, not recency:** `reach × severity × recency`. Reach = `1 + 2·ln(1+reactions) + ln(1+comments)` (log-compressed so one viral thread can't dominate). Severity from labels (bug 3.0 → docs 0.8). Recency decays over ~60 days.
- **Themes over tickets:** duplicate reports are grouped so effort targets the fix that retires the most reports.
- **Churn risk** is the deliberate inverse — it rewards neglect (old + popular + idle), catching what the leverage sort hides.
- **v2 seam:** replace keyword themes with embedding clusters (pgvector) for true semantic dedup; join PR mergeability + linked-issue leverage for review ranking.
