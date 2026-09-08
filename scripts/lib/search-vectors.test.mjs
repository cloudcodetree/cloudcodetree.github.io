import { describe, expect, it } from 'vitest';
import { cosine, meanVector, encodeVector, decodeVector, relatedFor } from './search-vectors.mjs';

describe('vector math', () => {
  it('cosine of identical vectors is 1, orthogonal is 0', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it('mean averages per dimension', () => {
    expect(meanVector([[1, 2], [3, 4]])).toEqual([2, 3]);
  });
  it('base64 round-trips at float32 precision', () => {
    const v = [0.1, -0.25, 3];
    const back = decodeVector(encodeVector(v));
    expect(back.length).toBe(3);
    back.forEach((x, i) => expect(x).toBeCloseTo(v[i], 5));
  });
});

describe('relatedFor', () => {
  const entries = [
    { id: 'a', vector: [1, 0, 0], date: 100 },
    { id: 'b', vector: [0.9, 0.1, 0], date: 200 },
    { id: 'c', vector: [0, 1, 0], date: 300 },
    { id: 'd', vector: [0.9, 0.1, 0.01], date: 50 },
  ];
  it('ranks by cosine, never includes self, caps at k', () => {
    const rel = relatedFor(entries, { k: 2 });
    expect(rel.a).toHaveLength(2);
    expect(rel.a).not.toContain('a');
    expect(new Set(rel.a)).toEqual(new Set(['b', 'd']));
    expect(rel.c[0]).not.toBe('c');
  });
  it('breaks near-ties toward the newer post', () => {
    const tie = [
      { id: 'x', vector: [1, 0], date: 10 },
      { id: 'old', vector: [1, 0], date: 0 },
      { id: 'new', vector: [1, 0], date: 1000 },
    ];
    expect(relatedFor(tie, { k: 2 }).x).toEqual(['new', 'old']);
  });
});
