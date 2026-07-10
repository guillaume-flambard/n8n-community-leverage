/**
 * n8n Community Leverage Engine — v2 (semantic clustering)
 *
 * v1 grouped issues by keyword buckets and left ~39% in "Other". v2 replaces that
 * with real semantic clustering: every issue is embedded with a local model
 * (nomic-embed-text via ollama — no API key, no cloud, nothing leaves the machine),
 * then greedily clustered by cosine similarity. Duplicate reports that share no
 * keywords but describe the same problem collapse into one theme.
 *
 * Embedding + clustering live in cluster.ts; the same normalized vectors drop into
 * pgvector unchanged when this needs to scale.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBacklog, HERE, gh, parseNum } from './lib.ts';
import { embedAll, clusterBySeed, nameCluster } from './cluster.ts';

const THRESH = parseNum(process.env.THRESH, 0.74, 0, 1);

const { issues } = loadBacklog();
const emb = await embedAll(issues);
const clusters = clusterBySeed(issues, emb, THRESH);
const multi = clusters.filter((c) => c.members.length > 1);
const singleton = clusters.length - multi.length;
const collapsed = multi.reduce((s, c) => s + c.members.length, 0);
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
multi.slice(0, 8).forEach((c) => {
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
md += `- **Local embeddings:** each issue (title + body) embedded with \`nomic-embed-text\` via ollama. No API key, no egress, no external DB.\n`;
md += `- **Greedy clustering:** issues sorted by leverage seed clusters; each subsequent issue joins the nearest seed above cosine ${THRESH}, else starts a new theme.\n`;
md += `- **Production seam:** same normalized vectors drop into pgvector unchanged; the greedy seed-based scan can be replaced by an IVFFlat ANN index on centroid kicks followed by local reassignment. Threshold ${THRESH} tunes granularity.\n`;

writeFileSync(join(HERE, '..', 'REPORT_v2.md'), md);

console.log(`\n${issues.length} issues -> ${clusters.length} themes (${multi.length} multi-issue, ${singleton} singletons)`);
console.log(`\nTOP 10 SEMANTIC THEMES:`);
clusters.slice(0, 10).forEach((c, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${nameCluster(c).padEnd(34)} ${String(c.members.length).padStart(3)} issues  Σlev ${c.leverage.toFixed(1)}`),
);
console.log(`\nReport -> REPORT_v2.md`);
