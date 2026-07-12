import { Client, GatewayIntentBits, Events } from 'discord.js';

// Dead-simple relay: #copilot message -> n8n webhook -> reply.
// The brain (AI Agent + RAG + tools) lives in n8n; this process only shuttles text.
const {
  DISCORD_BOT_TOKEN,
  COPILOT_CHANNEL_ID,
  N8N_WEBHOOK_URL,
  LEVERAGE_COPILOT_SECRET,
  REQUEST_TIMEOUT_MS = '90000', // wide enough to cover the ~46s ranking run
} = process.env;

for (const [key, value] of Object.entries({ DISCORD_BOT_TOKEN, COPILOT_CHANNEL_ID, N8N_WEBHOOK_URL })) {
  if (!value) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`leverage-copilot-bot ready as ${c.user.tag}, listening on channel ${COPILOT_CHANNEL_ID}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== COPILOT_CHANNEL_ID) return;

  const content = message.content.trim();
  if (!content) return;

  await message.channel.sendTyping();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(REQUEST_TIMEOUT_MS));
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(LEVERAGE_COPILOT_SECRET ? { 'x-leverage-secret': LEVERAGE_COPILOT_SECRET } : {}),
      },
      body: JSON.stringify({ message: content, user: message.author.username }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`n8n responded ${res.status}`);
    const answer = (await res.text()).trim();
    await reply(message, answer || 'Empty response from copilot.');
  } catch (err) {
    console.error('copilot request failed:', err);
    await reply(message, '⚠️ erreur, réessaie.');
  } finally {
    clearTimeout(timer);
  }
});

// Discord hard-caps a message at 2000 chars; chunk longer answers.
async function reply(message, text) {
  const chunks = text.match(/[\s\S]{1,1900}/g) ?? [text];
  for (const chunk of chunks) await message.reply(chunk);
}

client.login(DISCORD_BOT_TOKEN);
