import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { slugForTag, topicTags } from './topics.mjs';

describe('slugForTag', () => {
  it('lowercases and hyphenates', () => {
    expect(slugForTag('Claude Code')).toBe('claude-code');
    expect(slugForTag('UI/UX')).toBe('ui-ux');
    expect(slugForTag('Fine-Tuning')).toBe('fine-tuning');
    expect(slugForTag('AI for Your Role')).toBe('ai-for-your-role');
    expect(slugForTag('  Design-to-Code ')).toBe('design-to-code');
  });

  it('never collides across the live vocabulary', () => {
    const posts = JSON.parse(readFileSync('public/blog/posts.json', 'utf8'));
    const tags = [...new Set(posts.flatMap((p) => p.tags))];
    const slugs = tags.map(slugForTag);
    expect(new Set(slugs).size).toBe(tags.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe('topicTags', () => {
  it('counts, sorts, and hides AI', () => {
    const posts = [
      { tags: ['AI', 'News', 'Security'] },
      { tags: ['AI', 'Security'] },
      { tags: ['ai', 'Tutorial'] },
    ];
    expect(topicTags(posts)).toEqual([
      { tag: 'Security', slug: 'security', count: 2 },
      { tag: 'News', slug: 'news', count: 1 },
      { tag: 'Tutorial', slug: 'tutorial', count: 1 },
    ]);
  });
});
