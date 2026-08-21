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

  it('span-calculator is the coming-soon demo pilot', () => {
    expect(bySlug['span-calculator'].demoStatus).toBe('coming-soon');
  });

  it('slugs are url-safe', () => {
    for (const p of projects) expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });
});
