import { describe, expect, it } from 'vitest';
import { planIndex } from './search-plan.mjs';
import { postHash, vectorIdFor } from './search-text.mjs';

const post = (id, content) => ({ id, title: 't', excerpt: 'e', tags: ['AI'], content, date: '09-07-2026' });

describe('planIndex', () => {
  it('embeds new posts and leaves unchanged ones alone', () => {
    const a = post('a', 'alpha');
    const manifest = { version: 1, model: 'm', posts: { a: { hash: postHash(a), chunks: 1, date: 1, v: '' } } };
    const plan = planIndex([a, post('b', 'beta')], manifest);
    expect(plan.toEmbed.map((p) => p.id)).toEqual(['b']);
    expect(plan.toDelete).toEqual([]);
    expect(plan.unchanged).toBe(1);
  });

  it('re-embeds a changed post and deletes its old chunk ids first', () => {
    const a = post('a', 'alpha v2');
    const manifest = { version: 1, model: 'm', posts: { a: { hash: 'stale', chunks: 3, date: 1, v: '' } } };
    const plan = planIndex([a], manifest);
    expect(plan.toEmbed.map((p) => p.id)).toEqual(['a']);
    expect(plan.toDelete).toEqual([vectorIdFor('a', 0), vectorIdFor('a', 1), vectorIdFor('a', 2)]);
  });

  it('deletes every chunk of a vanished post', () => {
    const manifest = { version: 1, model: 'm', posts: { gone: { hash: 'x', chunks: 2, date: 1, v: '' } } };
    const plan = planIndex([], manifest);
    expect(plan.toDelete).toEqual([vectorIdFor('gone', 0), vectorIdFor('gone', 1)]);
    expect(plan.toEmbed).toEqual([]);
  });

  it('treats a missing manifest as empty', () => {
    const plan = planIndex([post('a', 'x')], null);
    expect(plan.toEmbed).toHaveLength(1);
  });
});
