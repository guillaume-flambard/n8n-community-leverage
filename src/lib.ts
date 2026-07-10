/**
 * Shared backlog loading + leverage scoring.
 * Used by both the v1 (keyword-theme) and v2 (embedding-cluster) reports.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const DATA = join(HERE, '..', 'data');

export const NOW = Date.parse('2026-07-07T00:00:00Z'); // fixed clock for reproducibility
const DAY = 86_400_000;
export const daysBetween = (a: number, b: number) => Math.max(0, (a - b) / DAY);

export const OLLAMA_BASE = 'http://localhost:11434/api';

export function parseNum(val: string | undefined, fallback: number, lo?: number, hi?: number): number {
  if (val === undefined) return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value: "${val}"`);
  if (lo !== undefined && n < lo) throw new Error(`Value ${n} is below minimum ${lo}`);
  if (hi !== undefined && n > hi) throw new Error(`Value ${n} is above maximum ${hi}`);
  return n;
}

export async function ollamaHealthCheck(): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Ollama health check failed (${res.status})`);
}

export async function ollamaFetch<T>(endpoint: string, body: Record<string, unknown>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`ollama ${endpoint} ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

type Label = { name: string };
type RawItem = {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  reactions?: { total_count: number };
  comments: number;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
  pull_request?: unknown;
  draft?: boolean;
  author_association?: string;
};

export type Scored = {
  number: number;
  title: string;
  body: string;
  kind: 'issue' | 'pr';
  reactions: number;
  comments: number;
  ageDays: number;
  idleDays: number;
  severity: number;
  reach: number;
  leverage: number;
  churnRisk: number;
  labels: string[];
  draft: boolean;
  community: boolean;
};

function flat<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return (raw as unknown[]).flat(Infinity) as T[];
  return [];
}

export function severityFromLabels(labels: string[]): number {
  const has = (s: string) => labels.some((l) => l.toLowerCase().includes(s));
  if (has('bug') || has('crash') || has('regression')) return 3.0;
  if (has('node/issue') || has('security')) return 2.5;
  if (has('node/improvement') || has('enhancement') || has('feature')) return 1.6;
  if (has('question') || has('docs') || has('documentation')) return 0.8;
  return 1.4;
}

export function score(item: RawItem, kind: 'issue' | 'pr'): Scored {
  const labels = item.labels.map((l) => l.name);
  const reactions = item.reactions?.total_count ?? 0;
  const comments = item.comments ?? 0;
  const created = Date.parse(item.created_at);
  const updated = Date.parse(item.updated_at);
  const ageDays = daysBetween(NOW, created);
  const idleDays = daysBetween(NOW, updated);
  const severity = severityFromLabels(labels);
  const reach = 1 + 2 * Math.log1p(reactions) + Math.log1p(comments);
  const recency = Math.exp(-idleDays / 60);
  const leverage = reach * severity * recency;
  const churnRisk = reach * severity * Math.log1p(ageDays) * Math.min(1, idleDays / 30);
  const assoc = item.author_association ?? 'NONE';
  const community = assoc === 'NONE' || assoc === 'CONTRIBUTOR' || assoc === 'FIRST_TIME_CONTRIBUTOR';
  return {
    number: item.number,
    title: item.title,
    body: (item.body ?? '').slice(0, 600),
    kind,
    reactions,
    comments,
    ageDays: Math.round(ageDays),
    idleDays: Math.round(idleDays),
    severity,
    reach: +reach.toFixed(2),
    leverage: +leverage.toFixed(2),
    churnRisk: +churnRisk.toFixed(2),
    labels,
    draft: !!item.draft,
    community,
  };
}

export function loadBacklog(): { issues: Scored[]; prs: Scored[] } {
  const issuesRaw = flat<RawItem>(JSON.parse(readFileSync(join(DATA, 'issues_raw.json'), 'utf8')));
  const pullsRaw = flat<RawItem>(JSON.parse(readFileSync(join(DATA, 'pulls_raw.json'), 'utf8')));
  const issues = issuesRaw.filter((x) => !x.pull_request).map((i) => score(i, 'issue'));
  const prStubs = new Map(issuesRaw.filter((x) => x.pull_request).map((x) => [x.number, x]));
  const prs = pullsRaw.map((p) => {
    const stub = prStubs.get(p.number);
    return score({ ...p, reactions: stub?.reactions, comments: stub?.comments ?? p.comments }, 'pr');
  });
  return { issues, prs };
}

export const ghUrl = (n: number, kind: 'issue' | 'pr' = 'issue') =>
  kind === 'pr'
    ? `https://github.com/n8n-io/n8n/pull/${n}`
    : `https://github.com/n8n-io/n8n/issues/${n}`;

/** @deprecated prefer ghUrl with explicit kind */
export const gh = (n: number, kind: 'issue' | 'pr' = 'issue') => ghUrl(n, kind);
