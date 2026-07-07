/**
 * Local embedding + cosine clustering. Shared by leverage_v2.ts and briefs.ts.
 * Embeddings come from ollama (nomic-embed-text) and are cached to disk. Nothing
 * leaves the machine; no external vector DB is touched.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, type Scored } from './lib.ts';

const OLLAMA = 'http://localhost:11434/api/embeddings';
const MODEL = 'nomic-embed-text';
const CACHE = join(DATA, 'embeddings.json');

export type Cluster = { id: number; centroid: number[]; members: Scored[]; leverage: number; reactions: number };

export function normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}
export const cosine = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // inputs normalized
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

export async function embedAll(items: Scored[]): Promise<Map<number, number[]>> {
  const cache: Record<string, number[]> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
  const out = new Map<number, number[]>();
  const todo = items.filter((i) => !cache[i.number]);
  if (todo.length) process.stderr.write(`embedding ${todo.length} new / ${items.length} total\n`);
  const CONC = 6;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    const vecs = await Promise.all(batch.map((it) => embedOne(`${it.title}\n${it.body}`)));
    batch.forEach((it, k) => (cache[it.number] = vecs[k]));
  }
  if (todo.length) writeFileSync(CACHE, JSON.stringify(cache));
  for (const it of items) out.set(it.number, cache[it.number]);
  return out;
}

/** Greedy clustering seeded by leverage; each cluster anchored on its seed vector. */
export function clusterBySeed(items: Scored[], emb: Map<number, number[]>, thresh: number): Cluster[] {
  const seeds = [...items].sort((a, b) => b.leverage - a.leverage);
  const clusters: Cluster[] = [];
  for (const it of seeds) {
    const v = emb.get(it.number);
    if (!v) continue;
    let best: Cluster | null = null;
    let bestSim = thresh;
    for (const c of clusters) {
      const sim = cosine(c.centroid, v);
      if (sim > bestSim) {
        bestSim = sim;
        best = c;
      }
    }
    if (best) {
      best.members.push(it);
      best.leverage += it.leverage;
      best.reactions += it.reactions;
    } else {
      clusters.push({ id: clusters.length, centroid: v, members: [it], leverage: it.leverage, reactions: it.reactions });
    }
  }
  return clusters.sort((a, b) => b.leverage - a.leverage);
}

const STOP = new Set(
  'the a an of to in on for with and or not is are be node n8n when after using does doesnt cant not from into via new bug issue error fails failing support add missing get set no you your it its this that which while workflow'.split(
    ' ',
  ),
);
export function nameCluster(c: Cluster): string {
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
  return top.length ? top.join(' / ') : c.members[0].title.slice(0, 40);
}
