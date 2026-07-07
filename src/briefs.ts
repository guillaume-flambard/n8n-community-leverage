/**
 * Contributor Brief generator.
 *
 * For each top semantic theme (from cluster.ts), a local LLM (qwen3.5:9b via
 * ollama) drafts a scoped "good first issue" brief a Community Engineer could hand
 * to a contributor: what users report, the likely area, an approach, and scope.
 *
 * This is the payoff of the tool: it does not just prioritise the backlog, it turns
 * the top of it into contributable work. Briefs are LLM-drafted starting points,
 * clearly labelled as hypotheses — not verified root causes.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBacklog, HERE, gh, type Scored } from './lib.ts';
import { embedAll, clusterBySeed, nameCluster, type Cluster } from './cluster.ts';

const GEN = 'http://localhost:11434/api/generate';
const MODEL = process.env.BRIEF_MODEL ?? 'llama3.2:3b'; // 3b is light + won't OOM; set BRIEF_MODEL=qwen3.5:9b for higher quality if you have the RAM
const THRESH = Number(process.env.THRESH ?? 0.74);
const TOP_THEMES = Number(process.env.TOP ?? 6);

// Real, verified code entry points for themes I have mapped by hand. These are
// injected as authoritative, separate from the LLM's hypotheses.
const KNOWN_ENTRIES: { match: RegExp; note: string }[] = [
  {
    match: /\bmcp\b/i,
    note: 'Verified entry points: `packages/@n8n/nodes-langchain/nodes/mcp/McpTrigger/McpTrigger.node.ts` (webhook + emitted workflowData) and `.../McpTrigger/McpServer.ts` (request handling, sessions, transports). Compare against the Webhook node in `packages/nodes-base/nodes/Webhook/Webhook.node.ts` for how request metadata is exposed.',
  },
];

async function generate(prompt: string): Promise<string> {
  const res = await fetch(GEN, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.2, num_ctx: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`ollama generate ${res.status}`);
  const j = (await res.json()) as { response: string };
  return j.response.trim();
}

function promptFor(theme: string, members: Scored[]): string {
  const items = members
    .sort((a, b) => b.leverage - a.leverage)
    .slice(0, 6)
    .map((m) => `- #${m.number} (${m.reactions}👍): ${m.title}\n  ${m.body.replace(/\s+/g, ' ').slice(0, 280)}`)
    .join('\n');
  return `You are a senior maintainer writing a contributor brief for an open-source project (n8n, a Node.js/TypeScript workflow-automation tool). Below is a cluster of related open GitHub issues grouped under the theme "${theme}".

Issues:
${items}

Write a concise contributor brief in Markdown with EXACTLY these sections:
**Problem** — 2-3 sentences synthesising what users actually experience across these issues.
**Likely area** — where in a Node.js/TS automation tool this probably lives. If you are not sure of exact files, describe the subsystem and say it is a hypothesis. Do NOT invent precise file paths.
**Suggested approach** — 2-4 concrete steps a contributor could take.
**Scope** — one of S / M / L, with a one-line justification.
**Good first issue** — yes or no, and why.

Be specific and technical. Admit uncertainty rather than guessing. Do not add sections beyond these five. Keep the whole brief under 220 words.`;
}

const { issues } = loadBacklog();
const emb = await embedAll(issues);
const clusters = clusterBySeed(issues, emb, THRESH).filter((c) => c.members.length > 1);
const top = clusters.slice(0, TOP_THEMES);

process.stderr.write(`generating ${top.length} briefs with ${MODEL}...\n`);

let md = `# n8n Community — Contributor Briefs\n\n`;
md += `_Auto-drafted from the top ${top.length} semantic themes by a local LLM (${MODEL}). `;
md += `Briefs are starting hypotheses for contributors, not verified root causes._\n\n`;
md += `Each theme below groups multiple open issues; one fix can retire the cluster.\n\n`;

let i = 0;
for (const c of top) {
  i++;
  const name = nameCluster(c);
  process.stderr.write(`  [${i}/${top.length}] ${name}\n`);
  const brief = await generate(promptFor(name, c.members));
  // Only attach a verified code-entry note when the THEME itself is that topic —
  // not merely because one member issue mentions the keyword.
  const known = KNOWN_ENTRIES.find((k) => k.match.test(name));

  md += `## ${i}. ${name}\n\n`;
  md += `**${c.members.length} issues · ${c.reactions}👍 · Σleverage ${c.leverage.toFixed(1)}**\n\n`;
  md += brief + `\n\n`;
  if (known) md += `> 📍 ${known.note}\n\n`;
  md += `**Issues covered:**\n`;
  c.members
    .sort((a, b) => b.leverage - a.leverage)
    .forEach((m) => (md += `- [#${m.number}](${gh(m.number)}) ${m.title}\n`));
  md += `\n---\n\n`;
}

writeFileSync(join(HERE, '..', 'BRIEFS.md'), md);
console.log(`\nWrote ${top.length} briefs -> BRIEFS.md`);
