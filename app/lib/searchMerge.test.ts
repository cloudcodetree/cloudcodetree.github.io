import { describe, expect, it } from 'vitest';
import { rrfMerge } from './searchMerge';

describe('rrfMerge', () => {
  it('a post in both lists outranks one in either alone', () => {
    expect(rrfMerge([['a', 'b', 'c'], ['c', 'd']])[0]).toBe('c');
  });
  it('returns the single list unchanged when the other is empty', () => {
    expect(rrfMerge([['a', 'b'], []])).toEqual(['a', 'b']);
  });
  it('dedupes and keeps every id', () => {
    const out = rrfMerge([['a', 'b'], ['b', 'x']]);
    expect(new Set(out)).toEqual(new Set(['a', 'b', 'x']));
    expect(out).toHaveLength(3);
  });
});
