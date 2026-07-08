/**
 * n8n Community Leverage Engine — v1 (keyword themes)
 *
 * Ranks the open backlog by leverage (see lib.ts) and groups issues into themes
 * using keyword/label heuristics. Fast, dependency-free, runs on public data.
 * Its weakness — a large "Other" bucket — is what v2 (leverage_v2.ts) fixes with
 * local embedding clusters.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBacklog, HERE, gh, type Scored } from './lib.ts';

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
  const node = labels.find((l) => l.startsWith('node/'));
  return node ? `Node: ${node}` : 'Other';
}

const { issues, prs } = loadBacklog();

type Theme = { key: string; leverage: number; count: number; reactions: number; top: Scored[] };
const themes = new Map<string, Theme>();
for (const it of issues) {
  const key = themeOf(it.title, it.labels);
  const t = themes.get(key) ?? { key, leverage: 0, count: 0, reactions: 0, top: [] };
  t.leverage += it.leverage;
  t.count += 1;
  t.reactions += it.reactions;
  t.top.push(it);
  themes.set(key, t);
}
const themeRanking = [...themes.values()]
  .map((t) => ({ ...t, top: t.top.sort((a, b) => b.leverage - a.leverage).slice(0, 3) }))
  .sort((a, b) => b.leverage - a.leverage);

const topIssues = [...issues].sort((a, b) => b.leverage - a.leverage).slice(0, 15);
const churnTop = [...issues].sort((a, b) => b.churnRisk - a.churnRisk).slice(0, 10);
const reviewPRs = [...prs].filter((p) => !p.draft && p.community).sort((a, b) => b.leverage - a.leverage).slice(0, 15);

const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(0) : '0');
const totalLev = issues.reduce((s, i) => s + i.leverage, 0);

let md = '';
md += `# n8n Community Leverage Report (v1 — keyword themes)\n\n`;
md += `_Fixed 2026-07-07 clock over the live open backlog._\n\n`;
md += `**Backlog:** ${issues.length} open issues · ${prs.length} open PRs `;
md += `(${prs.filter((p) => p.community && !p.draft).length} community, review-ready)\n\n`;
md += `Ranking is by **leverage = reach × severity × recency**, not by date. Themes collapse duplicate reports so one fix can retire many.\n\n`;

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
  md += `| ${p.leverage} | ${p.comments} | ${p.idleDays} | [#${p.number}](${gh(p.number, 'pr')}) ${p.title} |\n`;
});

md += `\n---\n\n### Method\n`;
md += `- **Leverage, not recency:** \`reach × severity × recency\` (see lib.ts).\n`;
md += `- **Themes over tickets:** keyword/label buckets — fast but leaves an "Other" bucket. v2 replaces this with embedding clusters.\n`;
md += `- **Churn risk** rewards neglect (old + popular + idle), catching what the leverage sort hides.\n`;

writeFileSync(join(HERE, '..', 'REPORT.md'), md);

console.log(`issues=${issues.length} prs=${prs.length} themes=${themeRanking.length}`);
console.log(`\nTOP THEMES:`);
themeRanking.slice(0, 6).forEach((t, i) =>
  console.log(`  ${i + 1}. ${t.key.padEnd(28)} ${t.count} issues  Σlev ${t.leverage.toFixed(1)}`),
);
console.log(`\nReport written to REPORT.md`);
