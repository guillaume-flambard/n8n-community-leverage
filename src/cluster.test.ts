import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, cosine, clusterBySeed, nameCluster, type Cluster } from './cluster.ts';

describe('normalize', () => {
  it('returns unit vector', () => {
    const v = normalize([3, 4]);
    assert.equal(v[0], 0.6);
    assert.equal(v[1], 0.8);
  });

  it('handles zero vector without division by zero', () => {
    const v = normalize([0, 0, 0]);
    assert.deepEqual(v, [0, 0, 0]);
  });

  it('handles negative values', () => {
    const v = normalize([-3, -4]);
    assert.equal(v[0], -0.6);
    assert.equal(v[1], -0.8);
  });

  it('preserves dimension count', () => {
    assert.equal(normalize([1, 2, 3, 4]).length, 4);
  });
});

describe('cosine', () => {
  it('returns 1 for identical vectors', () => {
    const v = normalize([1, 2, 3]);
    assert.equal(cosine(v, v), 1);
  });

  it('returns 0 for orthogonal vectors', () => {
    assert.equal(cosine([1, 0, 0], [0, 1, 0]), 0);
  });

  it('returns -1 for opposite vectors', () => {
    assert.equal(cosine([1, 0], [-1, 0]), -1);
  });

  it('returns correct similarity for normalized vectors', () => {
    const a = normalize([1, 2, 3]);
    const b = normalize([4, 5, 6]);
    const sim = cosine(a, b);
    assert.ok(sim > 0.9 && sim < 1);
  });

  it('handles same-length vectors of any size', () => {
    assert.doesNotThrow(() => cosine(new Array(768).fill(0.1), new Array(768).fill(0.2)));
  });
});

describe('clusterBySeed', () => {
  const mkItem = (num: number, leverage: number) => ({
    number: num,
    title: `Issue ${num}`,
    body: '',
    kind: 'issue' as const,
    reactions: 0,
    comments: 0,
    ageDays: 10,
    idleDays: 2,
    severity: 1,
    reach: 1,
    leverage,
    churnRisk: 0,
    labels: [],
    draft: false,
    community: true,
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(clusterBySeed([], new Map(), 0.7), []);
  });

  it('creates one cluster per item at high threshold', () => {
    const items = [mkItem(1, 10), mkItem(2, 5)];
    const emb = new Map<number, number[]>([[1, [1, 0]], [2, [0, 1]]]);
    const clusters = clusterBySeed(items, emb, 0.99);
    assert.equal(clusters.length, 2);
  });

  it('merges similar items at low threshold', () => {
    const items = [mkItem(1, 10), mkItem(2, 5)];
    const emb = new Map<number, number[]>([[1, [0.6, 0.8]], [2, [0.6, 0.8]]]);
    const clusters = clusterBySeed(items, emb, 0.5);
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].members.length, 2);
  });

  it('skips items without embeddings', () => {
    const items = [mkItem(1, 10)];
    const clusters = clusterBySeed(items, new Map(), 0.5);
    assert.equal(clusters.length, 0);
  });

  it('sorts clusters by descending leverage', () => {
    const items = [mkItem(1, 5), mkItem(2, 10)];
    const emb = new Map<number, number[]>([[1, [1, 0]], [2, [0, 1]]]);
    const clusters = clusterBySeed(items, emb, 0);
    assert.equal(clusters[0].leverage, 10);
    assert.equal(clusters[1].leverage, 5);
  });

  it('aggregates leverage and reactions in merged clusters', () => {
    const items = [mkItem(1, 7), mkItem(2, 3)];
    const emb = new Map<number, number[]>([[1, [0.6, 0.8]], [2, [0.6, 0.8]]]);
    const clusters = clusterBySeed(items, emb, 0.5);
    assert.equal(clusters[0].leverage, 10);
  });
});

describe('nameCluster', () => {
  const cluster = (titles: string[]): Cluster => ({
    id: 0,
    centroid: [1, 0],
    leverage: 10,
    reactions: 5,
    members: titles.map((title, i) => ({
      number: i + 1,
      title,
      body: '',
      kind: 'issue' as const,
      reactions: 0,
      comments: 0,
      ageDays: 10,
      idleDays: 2,
      severity: 1,
      reach: 1,
      leverage: 5,
      churnRisk: 0,
      labels: [],
      draft: false,
      community: true,
    })),
  });

  it('joins top frequent terms', () => {
    const c = cluster(['Loading takes forever', 'Loading timeout error', 'Loading spinner stuck']);
    const name = nameCluster(c);
    assert.match(name, /loading/i);
  });

  it('filters stop words from output', () => {
    const c = cluster(['create new project', 'creating project api', 'project deletion']);
    const name = nameCluster(c);
    assert.doesNotMatch(name, /\ba\b/);
    assert.match(name, /project/i);
  });

  it('filters words shorter than 3 characters', () => {
    const c = cluster(['fix my form', 'fix form layout', 'fix form validation']);
    const name = nameCluster(c);
    assert.doesNotMatch(name, /\bmy\b/);
    assert.match(name, /fix/i);
  });

  it('returns first member title prefix when no common words', () => {
    const c = cluster(['Unrelated one-off crash', 'Something completely different']);
    const name = nameCluster(c);
    assert.match(name, /Unrelated/);
  });
});
