import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { severityFromLabels, score, ghUrl, daysBetween, parseNum } from './lib.ts';

describe('severityFromLabels', () => {
  it('returns 3.0 for bugs', () =>
    assert.equal(severityFromLabels(['bug']), 3.0));
  it('returns 3.0 for crashes', () =>
    assert.equal(severityFromLabels(['crash']), 3.0));
  it('returns 3.0 for regressions', () =>
    assert.equal(severityFromLabels(['regression']), 3.0));
  it('returns 2.5 for node/issue', () =>
    assert.equal(severityFromLabels(['node/issue']), 2.5));
  it('returns 2.5 for security', () =>
    assert.equal(severityFromLabels(['security']), 2.5));
  it('returns 1.6 for enhancement', () =>
    assert.equal(severityFromLabels(['enhancement']), 1.6));
  it('returns 1.6 for feature', () =>
    assert.equal(severityFromLabels(['feature']), 1.6));
  it('returns 0.8 for docs', () =>
    assert.equal(severityFromLabels(['docs']), 0.8));
  it('returns 1.4 default for unknown labels', () =>
    assert.equal(severityFromLabels(['typescript']), 1.4));
});

describe('score', () => {
  const base = {
    number: 42,
    title: 'Test issue',
    body: 'hello',
    labels: [{ name: 'bug' }],
    comments: 10,
    reactions: { total_count: 5 },
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    user: { login: 'someone' },
    author_association: 'NONE',
  };

  it('calculates leverage as reach * severity * recency', () => {
    const r = score(base, 'issue');
    assert.equal(r.number, 42);
    assert.equal(r.kind, 'issue');
    assert.equal(r.reactions, 5);
    assert.equal(r.comments, 10);
    assert.equal(r.severity, 3.0);
    // reach = 1 + 2*log1p(5) + log1p(10) ≈ 1 + 2*1.79 + 2.40 ≈ 6.98
    assert.ok(r.reach > 6.0 && r.reach < 8.0);
    // leverage should be positive
    assert.ok(r.leverage > 0);
    assert.ok(r.churnRisk > 0);
  });

  it('handles zero reactions and comments', () => {
    const r = score({ ...base, reactions: { total_count: 0 }, comments: 0 }, 'issue');
    assert.equal(r.reach, 1 + 0.00);
    assert.equal(r.leverage, +(1 * 3.0 * Math.exp(-6 / 60)).toFixed(2));
  });

  it('handles missing reactions object', () => {
    const r = score({ ...base, reactions: undefined }, 'pr');
    assert.equal(r.reactions, 0);
  });

  it('flags community contributors', () => {
    const none = score({ ...base, author_association: 'NONE' }, 'issue');
    const contributor = score({ ...base, author_association: 'CONTRIBUTOR' }, 'issue');
    const member = score({ ...base, author_association: 'MEMBER' }, 'issue');
    assert.equal(none.community, true);
    assert.equal(contributor.community, true);
    assert.equal(member.community, false);
  });

  it('detects draft PRs', () => {
    const draft = score({ ...base, draft: true }, 'pr');
    const ready = score({ ...base, draft: false }, 'pr');
    assert.equal(draft.draft, true);
    assert.equal(ready.draft, false);
  });

  it('truncates bodies to 600 chars', () => {
    const long = score({ ...base, body: 'x'.repeat(1000) }, 'issue');
    assert.equal(long.body.length, 600);
  });

  it('detects FIRST_TIME_CONTRIBUTOR as community', () => {
    const ftc = score({ ...base, author_association: 'FIRST_TIME_CONTRIBUTOR' }, 'issue');
    assert.equal(ftc.community, true);
  });

  it('handles future-dated items with clamped age', () => {
    const future = { ...base, created_at: '2026-07-20T00:00:00Z', updated_at: '2026-07-20T00:00:00Z' };
    const r = score(future, 'issue');
    assert.equal(r.ageDays, 0);
    assert.equal(r.idleDays, 0);
  });

  it('churnRisk increases with idleDays (monotonic property)', () => {
    const fresh = score({ ...base, updated_at: '2026-07-05T00:00:00Z' }, 'issue');
    const stale = score({ ...base, updated_at: '2026-06-01T00:00:00Z' }, 'issue');
    assert.ok(stale.churnRisk > fresh.churnRisk);
  });
});

describe('daysBetween', () => {
  it('returns positive for earlier date', () => {
    const d = daysBetween(Date.parse('2026-07-10'), Date.parse('2026-07-01'));
    assert.equal(d, 9);
  });

  it('returns 0 for reversed dates', () => {
    const d = daysBetween(Date.parse('2026-07-01'), Date.parse('2026-07-10'));
    assert.equal(d, 0);
  });

  it('returns 0 for same date', () => {
    assert.equal(daysBetween(Date.parse('2026-07-07'), Date.parse('2026-07-07')), 0);
  });
});

describe('parseNum', () => {
  it('returns fallback for undefined', () => assert.equal(parseNum(undefined, 0.74), 0.74));
  it('parses valid string', () => assert.equal(parseNum('0.5', 0.74), 0.5));
  it('throws for NaN', () => assert.throws(() => parseNum('abc', 0.74)));
  it('throws when below minimum', () => assert.throws(() => parseNum('-1', 0.74, 0)));
  it('throws when above maximum', () => assert.throws(() => parseNum('2', 0.74, undefined, 1)));
  it('accepts boundary values', () => assert.equal(parseNum('0', 0.74, 0, 1), 0));
});

describe('ghUrl', () => {
  it('builds issue URL by default', () =>
    assert.equal(ghUrl(123), 'https://github.com/n8n-io/n8n/issues/123'));
  it('builds PR URL', () =>
    assert.equal(ghUrl(456, 'pr'), 'https://github.com/n8n-io/n8n/pull/456'));
});
