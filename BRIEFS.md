# n8n Community — Contributor Briefs

_Auto-drafted from the top 6 semantic themes by a local LLM (llama3.2:3b). Briefs are starting hypotheses for contributors, not verified root causes._

Each theme below groups multiple open issues; one fix can retire the cluster.

## 1. agent / tool / memory

**18 issues · 51👍 · Σleverage 74.8**

**Problem**
Users experience issues with the AI Agent node's memory management, leading to incorrect tool usage tracking, workflow failures, and silent dropping of LLM responses. Specifically, the agent fails to store tool usages in memory, passes errors to the wrong nodes, and drops mixed text and tool_use content blocks from LLM responses.

**Likely area**
This issue is likely related to the AI Agent node's interaction with the Memory subsystem, which stores conversation history and intermediate tool outputs. It may involve the implementation of the AI Agent node, its communication with other nodes, or the handling of errors and responses.

**Suggested approach**
1. Review the current implementation of the AI Agent node's memory management to understand how it interacts with the Memory subsystem.
2. Investigate why the agent fails to store tool usages in memory and how this affects workflow execution.
3. Analyze the behavior of the AI Agent node when encountering errors from tool nodes, such as Jira tools.

**Scope**
M (This issue requires a moderate amount of work, including reviewing code and investigating implementation details.)

**Good first issue**
No

**Issues covered:**
- [#14361](https://github.com/n8n-io/n8n/issues/14361) AI Agent doesn't store the Tool usages in memory
- [#24042](https://github.com/n8n-io/n8n/issues/24042) AI Agent node: Tool node errors fail workflow instead of returning error to agent for handling
- [#29119](https://github.com/n8n-io/n8n/issues/29119) [Bug] DeepSeek AI Agent node fails with 400 "Missing reasoning_content" when using tools with thinking mode (deepseek-v4-flash)
- [#20335](https://github.com/n8n-io/n8n/issues/20335) Claude 4.5 failing due to Postgres AI Memory Bug (Empty AI Message)
- [#26352](https://github.com/n8n-io/n8n/issues/26352) LLM responses with mixed text + tool_use content blocks are silently dropped
- [#22112](https://github.com/n8n-io/n8n/issues/22112) AI Agent v3.0 stores full intermediate tool outputs in Redis Chat Memory (memory pollution)
- [#33430](https://github.com/n8n-io/n8n/issues/33430) AI Agent fails turn with "Cannot set properties of undefined (setting 'strict')" when behind (chatHitlTool) node
- [#26373](https://github.com/n8n-io/n8n/issues/26373) Sub-agents unable to use MCP Tools due to Engine Request architecture
- [#31303](https://github.com/n8n-io/n8n/issues/31303) AI Agent + Vertex `gemini-3.5-flash`: 400 "missing thought_signature" on sequential multi-turn tool calls (post-#24982)
- [#33431](https://github.com/n8n-io/n8n/issues/33431) Redis Chat Memory Context Window truncates tool-call sequences and causes OpenAI Responses API error
- [#31860](https://github.com/n8n-io/n8n/issues/31860) AI Agent with nested AgentToolV3 + Redis Memory sends invalid OpenAI tool messages in n8n 2.25.1
- [#22310](https://github.com/n8n-io/n8n/issues/22310) Infinite loop when querying datatable from AI Agent node
- [#33406](https://github.com/n8n-io/n8n/issues/33406) Sonnet 5 via Bedrock: AI Agent output has random \n stuck in the middle of words
- [#31135](https://github.com/n8n-io/n8n/issues/31135) AI Agent v3 does not set tool_choice on iteration 1, causing small models on OpenAI-compatible providers to skip tool calls
- [#29758](https://github.com/n8n-io/n8n/issues/29758) Tool calling bug for agents using OpenRouter (various models)
- [#27767](https://github.com/n8n-io/n8n/issues/27767) [Bug]: AI Agent (v3.1) throws $getPairedItem lineage error when connected to an If node (observed on 'false' branch), resulting in empty success output
- [#23656](https://github.com/n8n-io/n8n/issues/23656) AI Agent V3 sends tools[0].strict = null to OpenAI-compatible backends, causing validation error
- [#28532](https://github.com/n8n-io/n8n/issues/28532) AI tool call events not emitted for ToolWorkflow, ToolHttpRequest, and ToolCode — log streaming blind spot

---

## 2. queue

**19 issues · 2👍 · Σleverage 36.2**

**Problem**
Users experience intermittent issues with workflow execution, including RabbitMQ triggers stopping consumption of messages, webhook triggers firing multiple times, HTTP Request nodes hanging, waiting webhooks failing to resume, and output parsers randomly failing. These issues can lead to workflows becoming stuck or failing to complete as expected.

**Likely area**
This problem is likely related to the `n8n-queue` subsystem, which handles message processing and workflow execution. It's a hypothesis that these issues are related to problems with message handling, worker management, or task runner interactions.

**Suggested approach**
To address this issue, a contributor could:
1. Investigate the RabbitMQ trigger implementation to identify potential causes of intermittent message consumption.
2. Review webhook trigger logic to understand why it fires multiple times and how to prevent this behavior.
3. Analyze HTTP Request node behavior to determine why some nodes hang or fail to send packets.

**Scope**
M - This issue requires a moderate amount of work, including investigation and potentially changes to existing code.

**Good first issue**
No

**Issues covered:**
- [#19877](https://github.com/n8n-io/n8n/issues/19877) RabbitMQ Trigger stops consuming messages intermittently in n8n 1.111.1 (requires manual workflow restart)
- [#31837](https://github.com/n8n-io/n8n/issues/31837) Webhook trigger firing multiple times
- [#33613](https://github.com/n8n-io/n8n/issues/33613) HTTP Request node hangs (ECONNABORTED, 0 packets sent) for some hosts while curl/wget from the same container reach them
- [#32509](https://github.com/n8n-io/n8n/issues/32509) 2.27.0 regression: waiting webhook resume returns 404 in queue mode when parent has saveDataSuccessExecution: none
- [#19266](https://github.com/n8n-io/n8n/issues/19266) Output Parser Randomly Failing After Most Recent Update - Function Calling Errors
- [#29372](https://github.com/n8n-io/n8n/issues/29372) External task runner: Code nodes time out for hours while /healthz reports healthy, no self-recovery
- [#31476](https://github.com/n8n-io/n8n/issues/31476) fatal error "Task request timed out after 60 seconds
- [#30249](https://github.com/n8n-io/n8n/issues/30249) Ticket has been open for a month!!! - n8n erroring out due to task request time out after 60 seconds
- [#32646](https://github.com/n8n-io/n8n/issues/32646) Bug report for n8n HTTP Request Batch Interval
- [#30392](https://github.com/n8n-io/n8n/issues/30392) job.finished() leaks EventEmitter listeners and setInterval in queue    mode when removeOnComplete/removeOnFail is true
- [#31437](https://github.com/n8n-io/n8n/issues/31437) n8n 2.22.5 segfaults (SIGSEGV / exit 139) on ARM64 after ~2h uptime — not the activation crash (#26844/#26859), regression since 2.18.5
- [#29742](https://github.com/n8n-io/n8n/issues/29742) N8N_RUNNERS_BROKER_LISTEN_ADDRESS=0.0.0.0 ignored — Task Broker always binds to 127.0.0.1 in Queue Mode with external runners
- [#27872](https://github.com/n8n-io/n8n/issues/27872) AI Agent workflow with Chat Trigger node but without a Chat Send Message node causes an error if it runs for longer than 1:30 minutes.
- [#25136](https://github.com/n8n-io/n8n/issues/25136) OpenAI Chat Model node does not retry 429 Rate Limit errors
- [#23787](https://github.com/n8n-io/n8n/issues/23787) QUEUE_BULL_REDIS_DUALSTACK=true unreliable on IPv6-only networks — fails during reconnects (Railway private networking)
- [#19820](https://github.com/n8n-io/n8n/issues/19820) [RabbitMQ Trigger] Unable to set Queue Type
- [#28525](https://github.com/n8n-io/n8n/issues/28525) RabbitMQ Node: Routing key expression evaluated only once for multi-item batches in exchange mode
- [#24544](https://github.com/n8n-io/n8n/issues/24544) The Main instance fails to start and gets stuck in an infinite loop of restarting.
- [#24699](https://github.com/n8n-io/n8n/issues/24699) Performance degradation while big users count

---

## 3. oauth / mcp / oauth2

**17 issues · 2👍 · Σleverage 29.4**

**Contributor Brief: OAuth/MCP Issues**

**Problem**
Users of n8n are experiencing issues with OAuth authentication, including expired tokens that require manual reconnecting, incorrect scope additions, and authorization failures. Specifically, users have reported problems with Calendly MCP, Salesforce OAuth, and OpenAI Node errors. These issues affect the usability and reliability of n8n's workflow automation capabilities.

**Likely area**
This problem likely resides in the OAuth/MCP subsystem, specifically in the authentication and token management logic. It is a hypothesis that this issue would be related to the way n8n handles OAuth tokens and refreshes them automatically.

**Suggested approach**
To address these issues, a contributor could:
1. Investigate the current implementation of OAuth token refresh logic in n8n.
2. Review existing tests for OAuth-related functionality to identify potential edge cases or regressions.
3. Collaborate with other contributors to gather more information about the specific issues reported.

**Scope**
M (This issue requires some investigation and testing, but is not critical to the overall stability of the project.)

**Good first issue**
Yes, as this issue involves a combination of OAuth-related functionality and potential edge cases, it provides an opportunity for a contributor to gain experience with n8n's codebase while making a tangible impact.

> 📍 Verified entry points: `packages/@n8n/nodes-langchain/nodes/mcp/McpTrigger/McpTrigger.node.ts` (webhook + emitted workflowData) and `.../McpTrigger/McpServer.ts` (request handling, sessions, transports). Compare against the Webhook node in `packages/nodes-base/nodes/Webhook/Webhook.node.ts` for how request metadata is exposed.

**Issues covered:**
- [#30875](https://github.com/n8n-io/n8n/issues/30875) MCP OAuth2 authentication is not automatically refreshed by n8n
- [#32278](https://github.com/n8n-io/n8n/issues/32278) Cannot register local n8n mcp with my claude desktop connector
- [#30147](https://github.com/n8n-io/n8n/issues/30147) MCP OAuth/DCR incorrectly adds scope=openid for Calendly MCP
- [#32421](https://github.com/n8n-io/n8n/issues/32421) Salesforce OAuth not working properly
- [#27228](https://github.com/n8n-io/n8n/issues/27228) openAI Node error 401: Authorization failed
- [#32681](https://github.com/n8n-io/n8n/issues/32681) DeviceFingerprint must NOT have fewer than 32 characters
- [#30853](https://github.com/n8n-io/n8n/issues/30853) 🚨 [BUG] OAuth2 credential authentication fails with "state parameter too long" — n8n embeds oversized encrypted payload in OAuth `state`, breaking compatibility with strict OAuth providers
- [#26453](https://github.com/n8n-io/n8n/issues/26453) Microsoft Outlook OAuth2 token refresh fails after ~1 hour on n8n Cloud, masked by dummy.stack.replace error
- [#12710](https://github.com/n8n-io/n8n/issues/12710) Google Credentials don't work anymore
- [#27718](https://github.com/n8n-io/n8n/issues/27718) get_workflow_details MCP tool consistently times out (>60s) via external MCP client (e.g. claude.ai)
- [#23306](https://github.com/n8n-io/n8n/issues/23306) OAuth Authorization Error: Unexpected token 'S', "Salted__..." is not valid JSON when creating Gmail OAuth2 credential
- [#29434](https://github.com/n8n-io/n8n/issues/29434) LinkedIn node fails with 'refreshToken is required' for standard OAuth apps (no Marketing Developer Platform)
- [#27363](https://github.com/n8n-io/n8n/issues/27363) Xero OAuth2 node does not support granular scopes / fails to authorize or perform write actions
- [#27803](https://github.com/n8n-io/n8n/issues/27803) REST API PUT /api/v1/workflows/{id} silently drops availableInMCP setting
- [#16601](https://github.com/n8n-io/n8n/issues/16601) Brevo Authentication Failing
- [#27186](https://github.com/n8n-io/n8n/issues/27186) MCP OAuth 2 Connection with mocoapp.com does not work
- [#27464](https://github.com/n8n-io/n8n/issues/27464) Chat Basic Auth issues in n8n UI

---

## 4. trigger / imap

**13 issues · 8👍 · Σleverage 28.4**

**Problem**
Users are experiencing issues with various triggers in n8n, including IMAP, Telegram, and email triggers, which fail to function as expected. Specifically, custom folders are not being detected by the IMAP trigger, sub-workflows are returning incorrect data, Telegram messages are not triggering executions, and email fields have whitespace validation issues.

**Likely area**
This problem likely resides in the Trigger subsystem of n8n's workflow automation tool, specifically within the Node.js/TypeScript implementation of these triggers. It is a hypothesis that the issues stem from a combination of incorrect folder detection, data transmission between sub-workflows, and validation logic in email fields.

**Suggested approach**
To address this issue, a contributor could:
1. Review the IMAP trigger node's behavior and implement correct folder detection logic.
2. Investigate and fix the data transmission issue between sub-workflows by reviewing the Agent's calls to sub-workflows.
3. Examine the Telegram Trigger node's functionality and ensure it is correctly handling incoming messages.

**Scope**
M - This scope allows for a focused investigation into specific trigger nodes, ensuring that changes do not introduce new issues or break existing functionality.

**Good first issue**
Yes, as this issue involves multiple triggers with different symptoms, tackling one aspect of the problem can help identify and fix the root cause.

**Issues covered:**
- [#12583](https://github.com/n8n-io/n8n/issues/12583) [IMAP Trigger Node] Does not trigger on new mails in custom folders (only in test mode) but with INBOX
- [#33539](https://github.com/n8n-io/n8n/issues/33539) After upgrading to 2.28.6, the Agent's calls to sub-workflows consistently return node data from the trigger instead of the data from the final node.
- [#29633](https://github.com/n8n-io/n8n/issues/29633) Telegram Trigger node is not working in my self-hosted n8n instance
- [#33052](https://github.com/n8n-io/n8n/issues/33052) Email Trigger IMAP broken
- [#33502](https://github.com/n8n-io/n8n/issues/33502) n8n Forms - Email Field Validation Bug?
- [#15240](https://github.com/n8n-io/n8n/issues/15240) Clicking on a folder with N8N_PATH and N8N_EDITOR_BASE_URL set causes 404
- [#28969](https://github.com/n8n-io/n8n/issues/28969) Outlook trigger, folders to include buggy. some folders work, some dont?
- [#30587](https://github.com/n8n-io/n8n/issues/30587) N8N Form Node does not open
- [#23132](https://github.com/n8n-io/n8n/issues/23132) Error when adding attachment to Create Draft node (Outlook)
- [#30179](https://github.com/n8n-io/n8n/issues/30179) IMAP trigger opens multiple simultaneous connections causing duplicate workflow executions
- [#30871](https://github.com/n8n-io/n8n/issues/30871) [Bug] silent imap death
- [#19169](https://github.com/n8n-io/n8n/issues/19169) IMAP Trigger Workflow Fires Multiple Times or Uses Outdated Version After Editing and Saving
- [#22638](https://github.com/n8n-io/n8n/issues/22638) When clicking on the "On app event" menu, the trigger nodes inside will be displayed repeatedly, such as the Webhook node.

---

## 5. mcp / server / client

**13 issues · 3👍 · Σleverage 26.9**

**Problem**
Users experience issues when interacting with the MCP (Microsoft Cloud Platform) server trigger in n8n, including:

* Custom request headers being discarded
* Workflows failing to save credential types after a pull request
* Transport selection dropdowns causing retry storms
* Invalid arguments breaking browser navigation
* Intermittent HTTP 500 errors when creating workflows from code

These issues affect the reliability and usability of the MCP server trigger, impacting users' ability to automate tasks effectively.

**Likely area**
This problem likely lives in the `mcp-server` subsystem, which is responsible for interacting with the Microsoft Cloud Platform server. Specifically, it may involve the `trigger` module or related functionality.

**Suggested approach**
To address these issues, a contributor could:

1. Investigate and fix the MCP Server Trigger to expose custom incoming request headers.
2. Review and update the MCP Client Tool to correctly handle transport selection dropdowns.
3. Analyze and resolve the intermittent HTTP 500 errors when creating workflows from code.
4. Examine and refactor the `get_workflow_details` function to handle cases where a draft contains a webhook node without parameters.

**Scope**
M (Medium): This issue requires some investigation, testing, and code changes, but is not critical to the overall stability of the n8n application.

**Good first issue**
Yes. These issues are relatively specific and technical, making them suitable for contributors who want to dive into a challenging problem.

> 📍 Verified entry points: `packages/@n8n/nodes-langchain/nodes/mcp/McpTrigger/McpTrigger.node.ts` (webhook + emitted workflowData) and `.../McpTrigger/McpServer.ts` (request handling, sessions, transports). Compare against the Webhook node in `packages/nodes-base/nodes/Webhook/Webhook.node.ts` for how request metadata is exposed.

**Issues covered:**
- [#30926](https://github.com/n8n-io/n8n/issues/30926) MCP Server Trigger discards incoming request headers, unlike Webhook Trigger
- [#27232](https://github.com/n8n-io/n8n/issues/27232) Glitch when pulling workflow with HTTP Node
- [#24967](https://github.com/n8n-io/n8n/issues/24967) [MCP Client] Transport selection dropdown ignored - causes 95M failed requests retry storm
- [#33512](https://github.com/n8n-io/n8n/issues/33512) MCP Client Tool v1.4 wraps Playwright MCP args in `value`, breaking browser_navigate
- [#31328](https://github.com/n8n-io/n8n/issues/31328) [MCP SDK] create_workflow_from_code intermittently returns HTTP 500, often as a false negative (workflow persists anyway, causing duplicates on retry)
- [#31705](https://github.com/n8n-io/n8n/issues/31705) MCP server: get_workflow_details crashes with "Cannot read properties of undefined (reading 'path')" when a draft contains a webhook node without parameters
- [#17188](https://github.com/n8n-io/n8n/issues/17188) Getting bad request when run mcp client on local.
- [#30652](https://github.com/n8n-io/n8n/issues/30652) HTTP Request node fires per-item requests concurrently
- [#26394](https://github.com/n8n-io/n8n/issues/26394) MCP tool calls fail in queue mode: `Tool node "<name>" does not have supplyData method` + `Worker tool execution timeout`
- [#26812](https://github.com/n8n-io/n8n/issues/26812) MCP server trigger stops working after a couple hours
- [#19902](https://github.com/n8n-io/n8n/issues/19902) MCP Server with sub-workflow based tools hangs when tools have Javascript code nodes (but not Python)
- [#16316](https://github.com/n8n-io/n8n/issues/16316) Issue: Twilio Trigger does not listen for webhook calls - instead it listens for sink events
- [#26536](https://github.com/n8n-io/n8n/issues/26536) [Chat Hub] MCP Client Tool sends null payload when fetching dynamic options

---

## 6. npm / install

**7 issues · 4👍 · Σleverage 23.1**

**Problem**
Users experience issues related to npm installation and module loading in n8n, resulting in errors such as "Cannot find module" or "Unknown error". These issues occur when running `npx n8n` or updating to a new version of n8n. The problems seem to be related to the way n8n handles module overrides, patches, and native npm installations.

**Likely area**
This problem likely lives in the `npm`/`install` subsystem, specifically with how n8n integrates with npm and handles module dependencies.

**Suggested approach**
1. Investigate the `npm` configuration and module loading process in n8n to identify potential issues.
2. Review existing code for overrides and patches, ensuring they are correctly applied during installation.
3. Test native npm installations to verify that n8n can properly handle module dependencies.

**Scope**
M - This issue requires a moderate amount of effort to resolve, as it involves investigating and testing the `npm`/`install` subsystem.

**Good first issue**
No

**Issues covered:**
- [#28572](https://github.com/n8n-io/n8n/issues/28572) 2.15.1 → 2.16.1: Failed to load module "breaking-changes"
- [#24556](https://github.com/n8n-io/n8n/issues/24556) Code node "Unknown error" after updating to n8n v2
- [#27067](https://github.com/n8n-io/n8n/issues/27067) NPM build of N8N does not honour overrides and patches
- [#31149](https://github.com/n8n-io/n8n/issues/31149) ## Bug: Python Task Runner fails on native npm install — `src/` folder missing from published package
- [#33582](https://github.com/n8n-io/n8n/issues/33582) n8n-node: Can't start local custom node project with n8n-node dev (ubuntu)
- [#28617](https://github.com/n8n-io/n8n/issues/28617) `npx n8n` fails with ETARGET for xlsx@0.20.2 while npm install n8n works
- [#27197](https://github.com/n8n-io/n8n/issues/27197) Incompatibility with node v25.8.1

---

