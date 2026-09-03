import { describe, expect, it } from 'vitest';
import { readProjects } from './lib/projects-data.mjs';

describe('readProjects', () => {
  const projects = readProjects();
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

  it('returns the full lineup in declaration order', () => {
    expect(projects.map((p) => p.slug)).toEqual([
      'nam-app',
      'motion-expression',
      'backlot',
      'homestead-finder',
      'span-calculator',
      'mac-desktop-navigator',
      'midea-mini-split-tools',
      'code-compare',
    ]);
  });

  it('every project has the card-critical fields', () => {
    for (const p of projects) {
      expect(p.title, p.slug).toBeTruthy();
      expect(p.summary, p.slug).toBeTruthy();
      expect(p.cover, p.slug).toMatch(/^\/projects\/covers\//);
    }
  });

  it('private repos carry no repo link', () => {
    expect(bySlug['homestead-finder'].repoUrl).toBeUndefined();
  });

  it('span-calculator is the live demo pilot with a pinned artifact', () => {
    expect(bySlug['span-calculator'].demoStatus).toBe('live');
    expect(bySlug['span-calculator'].artifact).toMatch(/^[0-9a-f]{40}$|^demo-v/);
  });

  it('only span-calculator is published for now', () => {
    expect(projects.filter((p) => !p.draft).map((p) => p.slug)).toEqual(['span-calculator']);
  });

  it('slugs are url-safe', () => {
    for (const p of projects) expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });
});
