# leverage-copilot-bot

A ~50-line Discord relay for the **Leverage Copilot**. It listens to one channel
(`#copilot`), forwards each message to the n8n *Copilot Router* webhook, and posts the
answer back. All intelligence — the AI Agent, RAG over the n8n backlog, and the ranking
tools — lives in n8n. This process only shuttles text.

## Flow

```
#copilot message ──▶ bot ──POST /webhook/copilot (x-leverage-secret)──▶ n8n Copilot Router
      ▲                                                                        │
      └──────────────────── reply ◀──────────── Respond to Webhook ◀───────────┘
```

- One message → one reply. Sends a typing indicator while n8n works.
- Gateway bot (not a slash command), so there is no 3s interaction deadline — even the
  ~46s ranking run returns fine.
- Long answers are chunked to Discord's 2000-char limit.

## Run locally

```bash
cd bot
cp .env.example .env   # fill in the values
npm install
npm start
```

## Deploy

Runs as the `leverage-copilot-bot` service in the VPS `docker-compose.yml`, on the same
Docker network as n8n so `N8N_WEBHOOK_URL` can use the internal hostname `http://n8n:5678`.

## Required Discord setup

- Enable the **Message Content Intent** (Developer Portal → your app → Bot → Privileged
  Gateway Intents).
- Invite the bot with `Send Messages` + `Read Message History` in `#copilot`.
