/**
 * Export n8n Simple Vector Store documents from cached embeddings + backlog.
 * Output: data/vector_documents.json — pageContent + metadata for Default Data Loader.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, loadBacklog, ghUrl, type Scored } from './lib.ts';

const CACHE = join(DATA, 'embeddings.json');
const OUT = join(DATA, 'vector_documents.json');

function docFromItem(it: Scored): { pageContent: string; metadata: Record<string, string | number> } {
  const labelStr = it.labels.slice(0, 6).join(', ');
  const kindLabel = it.kind === 'pr' ? 'PR' : 'Issue';
  return {
    pageContent: [
      `${kindLabel} #${it.number}: ${it.title}`,
      `Labels: ${labelStr || 'none'}`,
      `Reactions: ${it.reactions}, Comments: ${it.comments}`,
      `Leverage: ${it.leverage}, Churn risk: ${it.churnRisk}`,
      it.body ? `Description: ${it.body}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: {
      number: it.number,
      url: ghUrl(it.number, it.kind),
      leverage: it.leverage,
      kind: it.kind,
    },
  };
}

const TOP_PRS = Number(process.env.TOP_PRS ?? 15);

const embeddings: Record<string, number[]> = JSON.parse(readFileSync(CACHE, 'utf8'));
const { issues, prs } = loadBacklog();
const withEmb = issues.filter((i) => embeddings[String(i.number)]);
withEmb.sort((a, b) => b.leverage - a.leverage);

const topPrs = prs
  .filter((p) => !p.draft && p.community)
  .sort((a, b) => b.leverage - a.leverage)
  .slice(0, TOP_PRS);

const docs = [...withEmb.map(docFromItem), ...topPrs.map(docFromItem)];
writeFileSync(OUT, JSON.stringify(docs));
process.stderr.write(
  `exported ${withEmb.length} issues + ${topPrs.length} PRs (${docs.length} total) → ${OUT}\n`,
);
