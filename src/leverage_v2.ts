/**
 * n8n Community Leverage Engine — v2 (semantic clustering)
 *
 * v1 grouped issues by keyword buckets and left ~39% in "Other". v2 replaces that
 * with real semantic clustering: every issue is embedded with a local model
 * (nomic-embed-text via ollama — no API key, no cloud, nothing leaves the machine),
 * then greedily clustered by cosine similarity. Duplicate reports that share no
 * keywords but describe the same problem now collapse into one theme.
 *
 * The embedding store is local + in-process. It deliberately does NOT touch any
 * external Postgres/pgvector instance. Swapping this greedy in-memory clustering
 * for pgvector is a drop-in change (same vectors), left as the production seam.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadBacklog, DATA, HERE, gh, type Scored } from './lib.ts';

const OLLAMA = 'http://localhost:11434/api/embeddings';
const MODEL = 'nomic-embed-text';
// nomic-embed-text has a high similarity floor (~0.5-0.6 even for unrelated text),
// so the "same theme" threshold sits high. Tunable via THRESH env.
const THRESH = Number(process.env.THRESH ?? 0.74);
const CACHE = join(DATA, 'embeddings.json');

const { issues, prs } = loadBacklog();

// --- Embedding (local ollama), cached to disk so re-runs are instant ---
function normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}
const cosine = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // inputs are normalized
};

async function embedOne(text: string): Promise<number[]> {
  const res = await fetch(OLLAMA, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: `clustering: ${text}` }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const j = (await res.json()) as { embedding: number[] };
  return normalize(j.embedding);
}

async function embedAll(items: Scored[]): Promise<Map<number, number[]>> {
  const cache: Record<string, number[]> = existsSync(CACHE)
    ? JSON.parse(readFileSync(CACHE, 'utf8'))
    : {};
  const out = new Map<number, number[]>();
  const todo = items.filter((i) => !cache[i.number]);
  process.stderr.write(`embedding ${todo.length} new / ${items.length} total (cached: ${items.length - todo.length})\n`);

  const CONC = 6;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    const vecs = await Promise.all(batch.map((it) => embedOne(`${it.title}\n${it.body}`)));
    batch.forEach((it, k) => (cache[it.number] = vecs[k]));
    if (i % 60 === 0) process.stderr.write(`  ${i + batch.length}/${todo.length}\n`);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  for (const it of items) out.set(it.number, cache[it.number]);
  return out;
}

// --- Greedy cosine clustering, seeded by leverage (high-impact issues seed themes) ---
type Cluster = { id: number; centroid: number[]; members: Scored[]; leverage: number; reactions: number };

function cluster(items: Scored[], emb: Map<number, number[]>): Cluster[] {
  const seeds = [...items].sort((a, b) => b.leverage - a.leverage);
  const clusters: Cluster[] = [];
  for (const it of seeds) {
    const v = emb.get(it.number);
    if (!v) continue;
    let best: Cluster | null = null;
    let bestSim = THRESH;
    for (const c of clusters) {
      const sim = cosine(c.centroid, v);
      if (sim > bestSim) {
        bestSim = sim;
        best = c;
      }
    }
    if (best) {
      // Compare against the fixed seed vector (not a drifting mean). The mean
      // turns the first big cluster into a magnet that absorbs everything;
      // seed-anchored clusters stay tight around their high-leverage exemplar.
      best.members.push(it);
      best.leverage += it.leverage;
      best.reactions += it.reactions;
    } else {
      clusters.push({ id: clusters.length, centroid: v, members: [it], leverage: it.leverage, reactions: it.reactions });
    }
  }
  return clusters.sort((a, b) => b.leverage - a.leverage);
}

// --- Name a cluster from the salient words shared across its titles ---
const STOP = new Set(
  'the a an of to in on for with and or not is are be node n8n when after using does doesnt cant not from into via new bug issue error fails failing support add missing get set no you your it its this that which while workflow'.split(
    ' ',
  ),
);
function nameCluster(c: Cluster): string {
  const freq = new Map<string, number>();
  for (const m of c.members) {
    const seen = new Set<string>();
    for (const w of m.title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)) {
      if (w.length < 3 || STOP.has(w) || seen.has(w)) continue;
      seen.add(w);
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  const top = [...freq.entries()]
    .filter(([, n]) => n >= Math.max(2, Math.ceil(c.members.length * 0.25)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);
  const label = top.length ? top.join(' / ') : c.members[0].title.slice(0, 40);
  return label;
}

// --- Run ---
const emb = await embedAll(issues);
const clusters = cluster(issues, emb);
const multi = clusters.filter((c) => c.members.length > 1);
const singleton = clusters.length - multi.length;
const collapsed = multi.reduce((s, c) => s + c.members.length, 0);

// --- Report ---
const totalLev = issues.reduce((s, i) => s + i.leverage, 0);
let md = '';
md += `# n8n Community Leverage Report — v2 (semantic clustering)\n\n`;
md += `_Local embeddings (nomic-embed-text via ollama), fixed 2026-07-07 clock. Nothing leaves the machine._\n\n`;
md += `**Backlog:** ${issues.length} open issues embedded and clustered by meaning.\n\n`;
md += `**Dedup result:** ${issues.length} issues collapse into **${clusters.length} themes** `;
md += `(${multi.length} multi-issue clusters covering ${collapsed} issues; ${singleton} singletons). `;
md += `v1 keyword buckets left ~39% in "Other" — semantic clustering removes that bucket entirely.\n\n`;

md += `## Top themes by aggregate leverage\n\n`;
md += `| # | Theme (auto-named) | Issues | Σ👍 | Σ leverage | % total |\n|---|---|---:|---:|---:|---:|\n`;
clusters.slice(0, 15).forEach((c, i) => {
  const pctv = ((100 * c.leverage) / totalLev).toFixed(0);
  md += `| ${i + 1} | ${nameCluster(c)} | ${c.members.length} | ${c.reactions} | ${c.leverage.toFixed(1)} | ${pctv}% |\n`;
});

md += `\n## Inside the leading themes (one fix retires the whole cluster)\n\n`;
clusters
  .filter((c) => c.members.length > 1)
  .slice(0, 8)
  .forEach((c) => {
    md += `**${nameCluster(c)}** — ${c.members.length} issues, Σlev ${c.leverage.toFixed(1)}, ${c.reactions}👍\n`;
    c.members
      .sort((a, b) => b.leverage - a.leverage)
      .slice(0, 5)
      .forEach((m) => {
        md += `- [#${m.number}](${gh(m.number)}) ${m.title} — ${m.reactions}👍 ${m.comments}💬 lev ${m.leverage}\n`;
      });
    md += `\n`;
  });

md += `---\n\n### Method\n`;
md += `- **Local embeddings:** each issue (title + body) embedded with \`nomic-embed-text\` via ollama. No API key, no network egress, no external DB — the vector store is in-process.\n`;
md += `- **Greedy clustering:** issues sorted by leverage seed clusters; each subsequent issue joins the nearest centroid above cosine ${THRESH}, else starts a new theme. Themes are auto-named from salient shared title terms.\n`;
md += `- **Production seam:** the same normalized vectors drop into pgvector unchanged; greedy clustering becomes an ANN query. Threshold ${THRESH} is tunable per desired granularity.\n`;

writeFileSync(join(HERE, '..', 'REPORT_v2.md'), md);

console.log(`\n${issues.length} issues -> ${clusters.length} themes (${multi.length} multi-issue, ${singleton} singletons)`);
console.log(`\nTOP 10 SEMANTIC THEMES:`);
clusters.slice(0, 10).forEach((c, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${nameCluster(c).padEnd(34)} ${String(c.members.length).padStart(3)} issues  Σlev ${c.leverage.toFixed(1)}`),
);
console.log(`\nReport -> REPORT_v2.md`);
