/**
 * Export n8n Simple Vector Store documents from cached embeddings + backlog.
 * Output: data/vector_documents.json — pageContent + metadata for Default Data Loader.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, loadBacklog, gh, type Scored } from './lib.ts';

const CACHE = join(DATA, 'embeddings.json');
const OUT = join(DATA, 'vector_documents.json');

function docFromIssue(it: Scored): { pageContent: string; metadata: Record<string, string | number> } {
  const labelStr = it.labels.slice(0, 6).join(', ');
  return {
    pageContent: [
      `Issue #${it.number}: ${it.title}`,
      `Labels: ${labelStr || 'none'}`,
      `Reactions: ${it.reactions}, Comments: ${it.comments}`,
      `Leverage: ${it.leverage}, Churn risk: ${it.churnRisk}`,
      it.body ? `Description: ${it.body}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: {
      number: it.number,
      url: gh(it.number),
      leverage: it.leverage,
      kind: it.kind,
    },
  };
}

const embeddings: Record<string, number[]> = JSON.parse(readFileSync(CACHE, 'utf8'));
const { issues } = loadBacklog();
const withEmb = issues.filter((i) => embeddings[String(i.number)]);
withEmb.sort((a, b) => b.leverage - a.leverage);

const docs = withEmb.map(docFromIssue);
writeFileSync(OUT, JSON.stringify(docs));
process.stderr.write(`exported ${docs.length} documents → ${OUT}\n`);
