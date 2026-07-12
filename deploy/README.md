# Deploy — Discord copilot surface

Two idempotent, env-driven scripts. Run from the **repo root**. Neither touches n8n's
data volume; all prod changes are behind a confirm prompt (`FORCE=1` to skip).

## `deploy_copilot_discord.sh`
Ships the Discord front door end-to-end:
1. Snapshot the live copilot workflow → `workflows/.copilot-live-backup.json` (gitignored).
2. PUT the updated workflow (Webhook → Check Auth → AI Agent → Respond to Webhook),
   preserving the live Ollama credential binding; activate.
3. Restart n8n so `/webhook/copilot` registers (API activate alone does not register it).
4. rsync the relay bot to the VPS, detect n8n's Docker network, write `.env` on the box,
   `docker compose up -d --build`.

```bash
export N8N_API_URL=https://n8n.phangan.ai
export N8N_API_KEY=...            # n8n Settings -> n8n API
export LEVERAGE_COPILOT_SECRET=... # must match the n8n container
export DISCORD_BOT_TOKEN=...
export COPILOT_CHANNEL_ID=...
deploy/deploy_copilot_discord.sh
```

## `rollback_copilot_discord.sh`
Reverses it: stops the relay bot, restores the copilot workflow from the snapshot
(or `git HEAD` if absent), restarts n8n.

```bash
export N8N_API_URL=https://n8n.phangan.ai N8N_API_KEY=...
deploy/rollback_copilot_discord.sh
```

## Overridable env
`SSH_HOST` (ovh-echo) · `N8N_CONTAINER` (n8n) · `COPILOT_ID` (XtV6NerjQnYPtXgz) ·
`BACKUP` · `REMOTE_BOT_DIR` (/root/leverage-copilot-bot) · `WF_JSON` · `BOT_DIR` · `FORCE`

## Prerequisite (one-time)
Create the Discord bot app, enable the **Message Content Intent**, invite it to the server
with Send Messages + Read Message History, and copy the `#copilot` channel id.
