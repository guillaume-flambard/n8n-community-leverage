/**
 * n8n Community Leverage Engine — MVP
 *
 * Problem: n8n has ~427 open issues and ~1026 open PRs. Manual triage does not
 * scale, and per-issue AI labelling (which n8n already ships) still leaves the
 * hardest question unanswered: "of everything open, what do we fix / review
 * FIRST to help the most people?"
 *
 * This tool ranks the whole backlog by *leverage* rather than by date or raw
 * reactions, groups items into themes (so N duplicate reports collapse into one
 * fix), and surfaces the PRs worth reviewing first.
 *
 * v1 uses only structural GitHub signals (no embeddings) so it runs anywhere on
 * public data. Theme grouping is keyword/label based; the design leaves a clean
 * seam to swap in embedding-based semantic clustering (pgvector) as v2.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'data');

type Label = { name: string };
type Reactions = { total_count: number };
type RawItem = {
  number: number;
  title: string;
  body: string | null;
  labels: Label[];
  reactions?: Reactions;
  comments: number;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
  pull_request?: unknown;
  draft?: boolean;
  author_association?: string;
};

const NOW = Date.parse('2026-07-07T00:00:00Z'); // fixed clock for reproducibility
const DAY = 86_400_000;
const daysBetween = (a: number, b: number) => Math.max(0, (a - b) / DAY);

function flat<T>(raw: unknown): T[] {
  // gh api --paginate --slurp yields an array of pages (arrays). Flatten defensively.
  if (Array.isArray(raw)) return (raw as unknown[]).flat(Infinity) as T[];
  return [];
}

// --- Signal weights (transparent + tunable; this is the "editorial" of the tool) ---

// How severe is this item, from its labels. Bugs that break things outrank asks.
function severityFromLabels(labels: string[]): number {
  const has = (s: string) => labels.some((l) => l.toLowerCase().includes(s));
  if (has('bug') || has('crash') || has('regression')) return 3.0;
  if (has('node/issue') || has('security')) return 2.5;
  if (has('node/improvement') || has('enhancement') || has('feature')) return 1.6;
  if (has('question') || has('docs') || has('documentation')) return 0.8;
  return 1.4; // untriaged default — slightly above a pure question
}

// Themes let one fix retire many reports. Keyword/label buckets for v1.
const THEME_RULES: { key: string; test: (t: string, labels: string[]) => boolean }[] = [
  { key: 'MCP', test: (t) => /\bmcp\b/i.test(t) },
  { key: 'AI Agent / LangChain', test: (t) => /\b(ai agent|langchain|agent|llm|rag|openai|anthropic|ollama|gemini|vector\s?store|embedding|chat model)\b/i.test(t) },
  { key: 'Credentials / OAuth', test: (t) => /\b(oauth|credential|token|auth|api key)\b/i.test(t) },
  { key: 'Webhook / Trigger', test: (t) => /\b(webhook|trigger|polling)\b/i.test(t) },
  { key: 'Memory / Sessions', test: (t) => /\b(memory|session)\b/i.test(t) },
  { key: 'Docker / Deployment', test: (t) => /\b(docker|deployment|deploy|self-?host|kubernetes|k8s|helm|env var|environment variable|reverse proxy|nginx)\b/i.test(t) },
  { key: 'Database / Postgres/SQLite', test: (t) => /\b(postgres|sqlite|mysql|database|\bdb\b|migration|statement_timeout)\b/i.test(t) },
  { key: 'Editor / UI / Canvas', test: (t, l) => l.some((x) => x === 'ui') || /\b(editor|canvas|ndv|drag|node panel|sticky|zoom|ui\b)\b/i.test(t) },
  { key: 'HTTP Request node', test: (t) => /\bhttp request|\brest\b|pagination\b/i.test(t) },
  { key: 'Expressions / Data mapping', test: (t) => /expression|\{\{|data mapping|\$json|\$node/i.test(t) },
  { key: 'Execution / Workflow engine', test: (t) => /\b(execution|sub-?workflow|workflow (run|execut|fail)|loop|batch|pinned?|manual run)\b/i.test(t) },
  { key: 'Upgrade / Breaking change', test: (t) => /\b(upgrade|breaking|regression|after updat|\d+\.\d+\.\d+\s*(→|->|to)\s*\d)\b/i.test(t) },
  { key: 'Performance / Memory usage', test: (t) => /\b(performance|slow|memory (leak|usage)|cpu|crash|oom|freeze|hang)\b/i.test(t) },
  { key: 'Queue / Workers / Scaling', test: (t) => /\b(queue|worker|redis|concurrency|scaling|bull)\b/i.test(t) },
  { key: 'Binary / Files', test: (t) => /\b(binary|file|upload|download|s3|attachment|base64)\b/i.test(t) },
  { key: 'Integrations (Google/Slack/etc.)', test: (t) => /\b(google|gmail|sheets|drive|slack|notion|airtable|telegram|discord|microsoft|outlook|hubspot|salesforce|shopify|stripe)\b/i.test(t) },
  { key: 'Code / Function node', test: (t) => /\b(code node|function node|javascript|python|pyodide)\b/i.test(t) },
];

function themeOf(title: string, labels: string[]): string {
  for (const r of THEME_RULES) if (r.test(title, labels)) return r.key;
  // fall back to a node-scoped label if present, else "Other"
  const node = labels.find((l) => l.startsWith('node/'));
  return node ? `Node: ${node}` : 'Other';
}

type Scored = {
  number: number;
  title: string;
  kind: 'issue' | 'pr';
  reactions: number;
  comments: number;
  ageDays: number;
  idleDays: number;
  severity: number;
  reach: number;
  leverage: number;
  churnRisk: number;
  theme: string;
  labels: string[];
  draft: boolean;
  community: boolean;
};

function score(item: RawItem, kind: 'issue' | 'pr'): Scored {
  const labels = item.labels.map((l) => l.name);
  const reactions = item.reactions?.total_count ?? 0;
  const comments = item.comments ?? 0;
  const created = Date.parse(item.created_at);
  const updated = Date.parse(item.updated_at);
  const ageDays = daysBetween(NOW, created);
  const idleDays = daysBetween(NOW, updated);
  const severity = severityFromLabels(labels);

  // Reach = how many people this touches. Reactions are the strongest "me too"
  // signal; comments are engagement; both compressed with log to avoid a single
  // viral thread dominating.
  const reach = 1 + 2 * Math.log1p(reactions) + Math.log1p(comments);

  // Recency: an item touched recently is still live. Decays over ~60 days.
  const recency = Math.exp(-idleDays / 60);

  // Leverage = reach x severity x recency. The core ranking.
  const leverage = reach * severity * recency;

  // Churn risk = high-reach items left to rot. Old + popular + ignored = the
  // stuff that quietly burns community goodwill. (Deliberately the inverse of
  // recency: rewards NEglect, not activity.)
  const churnRisk = reach * severity * Math.log1p(ageDays) * Math.min(1, idleDays / 30);

  const community = (item.author_association ?? 'NONE') === 'NONE' ||
    item.author_association === 'CONTRIBUTOR' || item.author_association === 'FIRST_TIME_CONTRIBUTOR';

  return {
    number: item.number,
    title: item.title,
    kind,
    reactions,
    comments,
    ageDays: Math.round(ageDays),
    idleDays: Math.round(idleDays),
    severity,
    reach: +reach.toFixed(2),
    leverage: +leverage.toFixed(2),
    churnRisk: +churnRisk.toFixed(2),
    theme: themeOf(item.title, labels),
    labels,
    draft: !!item.draft,
    community,
  };
}

// --- Load ---
const issuesRaw = flat<RawItem>(JSON.parse(readFileSync(join(DATA, 'issues_raw.json'), 'utf8')));
const pullsRaw = flat<RawItem>(JSON.parse(readFileSync(join(DATA, 'pulls_raw.json'), 'utf8')));

// The /issues endpoint returns issues AND PRs (PRs carry a pull_request key and,
// unlike the /pulls endpoint, include reactions). Split accordingly.
const issues = issuesRaw.filter((x) => !x.pull_request).map((i) => score(i, 'issue'));
const prStubs = new Map(issuesRaw.filter((x) => x.pull_request).map((x) => [x.number, x]));

// Enrich /pulls (has draft flag) with reaction/comment data from the /issues feed.
const prs = pullsRaw.map((p) => {
  const stub = prStubs.get(p.number);
  return score({ ...p, reactions: stub?.reactions, comments: stub?.comments ?? p.comments }, 'pr');
});

// --- Theme rollup (issues) ---
type Theme = { key: string; leverage: number; count: number; reactions: number; top: Scored[] };
const themes = new Map<string, Theme>();
for (const it of issues) {
  const t = themes.get(it.theme) ?? { key: it.theme, leverage: 0, count: 0, reactions: 0, top: [] };
  t.leverage += it.leverage;
  t.count += 1;
  t.reactions += it.reactions;
  t.top.push(it);
  themes.set(it.theme, t);
}
const themeRanking = [...themes.values()]
  .map((t) => ({ ...t, top: t.top.sort((a, b) => b.leverage - a.leverage).slice(0, 3) }))
  .sort((a, b) => b.leverage - a.leverage);

// --- Rankings ---
const topIssues = [...issues].sort((a, b) => b.leverage - a.leverage).slice(0, 15);
const churnTop = [...issues].sort((a, b) => b.churnRisk - a.churnRisk).slice(0, 10);
const reviewPRs = [...prs]
  .filter((p) => !p.draft && p.community)
  .sort((a, b) => b.leverage - a.leverage)
  .slice(0, 15);

// --- Report ---
const gh = (n: number) => `https://github.com/n8n-io/n8n/issues/${n}`;
const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(0) : '0');
const totalLev = issues.reduce((s, i) => s + i.leverage, 0);

let md = '';
md += `# n8n Community Leverage Report\n\n`;
md += `_Generated on a fixed 2026-07-07 clock over the live open backlog._\n\n`;
md += `**Backlog:** ${issues.length} open issues · ${prs.length} open PRs `;
md += `(${prs.filter((p) => p.community && !p.draft).length} community, review-ready)\n\n`;
md += `Ranking is by **leverage = reach × severity × recency**, not by date. `;
md += `Themes collapse duplicate reports so one fix can retire many.\n\n`;

md += `## 1. Fix these themes first (highest aggregate leverage)\n\n`;
md += `| # | Theme | Issues | Σ reactions | Σ leverage | % of total |\n|---|---|---:|---:|---:|---:|\n`;
themeRanking.slice(0, 10).forEach((t, i) => {
  md += `| ${i + 1} | ${t.key} | ${t.count} | ${t.reactions} | ${t.leverage.toFixed(1)} | ${pct(t.leverage, totalLev)}% |\n`;
});
md += `\n### Top items inside the leading themes\n\n`;
themeRanking.slice(0, 5).forEach((t) => {
  md += `**${t.key}** — ${t.count} issues, one fix here helps the most:\n`;
  t.top.forEach((it) => {
    md += `- [#${it.number}](${gh(it.number)}) ${it.title} — ${it.reactions}👍 ${it.comments}💬 lev ${it.leverage}\n`;
  });
  md += `\n`;
});

md += `## 2. Single issues with the highest leverage\n\n`;
md += `| lev | 👍 | 💬 | age(d) | idle(d) | #/title |\n|---:|---:|---:|---:|---:|---|\n`;
topIssues.forEach((i) => {
  md += `| ${i.leverage} | ${i.reactions} | ${i.comments} | ${i.ageDays} | ${i.idleDays} | [#${i.number}](${gh(i.number)}) ${i.title} |\n`;
});

md += `\n## 3. Churn risk — popular issues left to rot\n\n`;
md += `_High reach × long-ignored. These quietly burn goodwill._\n\n`;
md += `| risk | 👍 | age(d) | idle(d) | #/title |\n|---:|---:|---:|---:|---|\n`;
churnTop.forEach((i) => {
  md += `| ${i.churnRisk} | ${i.reactions} | ${i.ageDays} | ${i.idleDays} | [#${i.number}](${gh(i.number)}) ${i.title} |\n`;
});

md += `\n## 4. Community PRs to review first\n\n`;
md += `_Non-draft, community-authored, ranked by leverage of the work._\n\n`;
md += `| lev | 💬 | idle(d) | #/title |\n|---:|---:|---:|---|\n`;
reviewPRs.forEach((p) => {
  md += `| ${p.leverage} | ${p.comments} | ${p.idleDays} | [#${p.number}](${gh(p.number)}) ${p.title} |\n`;
});

md += `\n---\n\n### Method (why this beats date-sorting and per-issue AI labels)\n`;
md += `- **Leverage, not recency:** \`reach × severity × recency\`. Reach = \`1 + 2·ln(1+reactions) + ln(1+comments)\` (log-compressed so one viral thread can't dominate). Severity from labels (bug 3.0 → docs 0.8). Recency decays over ~60 days.\n`;
md += `- **Themes over tickets:** duplicate reports are grouped so effort targets the fix that retires the most reports.\n`;
md += `- **Churn risk** is the deliberate inverse — it rewards neglect (old + popular + idle), catching what the leverage sort hides.\n`;
md += `- **v2 seam:** replace keyword themes with embedding clusters (pgvector) for true semantic dedup; join PR mergeability + linked-issue leverage for review ranking.\n`;

writeFileSync(join(HERE, '..', 'REPORT.md'), md);

// console summary
console.log(`issues=${issues.length} prs=${prs.length} themes=${themeRanking.length}`);
console.log(`\nTOP THEMES:`);
themeRanking.slice(0, 6).forEach((t, i) =>
  console.log(`  ${i + 1}. ${t.key.padEnd(28)} ${t.count} issues  Σlev ${t.leverage.toFixed(1)}`),
);
console.log(`\nTOP 5 ISSUES BY LEVERAGE:`);
topIssues.slice(0, 5).forEach((i) =>
  console.log(`  #${i.number} lev ${i.leverage} (${i.reactions}👍 ${i.comments}💬) ${i.title.slice(0, 60)}`),
);
console.log(`\nReport written to REPORT.md`);
