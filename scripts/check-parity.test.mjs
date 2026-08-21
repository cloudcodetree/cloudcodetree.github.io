import { describe, expect, it } from 'vitest';
import { evaluateCase, sitemapPaths, KNOWN_DIFFERENCES } from './check-parity.mjs';

const htmlCase = { path: '/about/', status: 200, contentType: /text\/html/, bodyIncludes: '<html' };
const h = (o) => new Headers(o);

describe('evaluateCase', () => {
  it('passes when everything matches', () => {
    expect(evaluateCase(htmlCase, {
      status: 200, headers: h({ 'content-type': 'text/html; charset=utf-8' }), body: '<html lang="en">',
    })).toEqual([]);
  });

  it('reports a status mismatch', () => {
    expect(evaluateCase(htmlCase, { status: 404, headers: h({ 'content-type': 'text/html' }), body: '<html>' }))
      .toContain('expected status 200, got 404');
  });

  it('accepts any status in a permitted set', () => {
    // GitHub Pages answers /about with 301; Workers force-trailing-slash uses
    // 307. Both are correct trailing-slash canonicalization.
    const redirectCase = { path: '/about', status: [301, 307, 308], location: '/about/' };
    expect(evaluateCase(redirectCase, { status: 307, headers: h({ location: '/about/' }), body: '' })).toEqual([]);
    expect(evaluateCase(redirectCase, { status: 301, headers: h({ location: '/about/' }), body: '' })).toEqual([]);
    expect(evaluateCase(redirectCase, { status: 302, headers: h({ location: '/about/' }), body: '' }))
      .toContain('expected status one of 301, 307, 308, got 302');
  });

  it('normalizes an absolute Location to a path before comparing', () => {
    const redirectCase = { path: '/about', status: [301, 307], location: '/about/' };
    expect(evaluateCase(redirectCase, {
      status: 307, headers: h({ location: 'https://example.workers.dev/about/' }), body: '',
    })).toEqual([]);
  });

  it('reports a missing body marker', () => {
    expect(evaluateCase(htmlCase, { status: 200, headers: h({ 'content-type': 'text/html' }), body: 'nope' }))
      .toContain('body does not contain "<html"');
  });

  it('reports a content-type mismatch', () => {
    expect(evaluateCase(htmlCase, { status: 200, headers: h({ 'content-type': 'application/json' }), body: '<html>' })
      .some((f) => f.startsWith('expected content-type'))).toBe(true);
  });
});

describe('sitemapPaths', () => {
  it('extracts pathnames from absolute sitemap URLs', () => {
    const xml = `<urlset>
      <url><loc>https://cloudcodetree.com/</loc></url>
      <url><loc>https://cloudcodetree.com/about/</loc></url>
      <url><loc>https://cloudcodetree.com/ai-news/some-post/</loc></url>
    </urlset>`;
    expect(sitemapPaths(xml)).toEqual(['/', '/about/', '/ai-news/some-post/']);
  });
});

describe('KNOWN_DIFFERENCES', () => {
  it('documents each accepted divergence with a reason', () => {
    expect(KNOWN_DIFFERENCES.length).toBeGreaterThan(0);
    for (const d of KNOWN_DIFFERENCES) {
      expect(d.path).toBeTruthy();
      expect(d.reason).toBeTruthy();
    }
  });
});
