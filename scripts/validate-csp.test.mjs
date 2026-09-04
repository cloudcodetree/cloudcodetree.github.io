import { describe, expect, it } from 'vitest';
import { parseCsp, findViolations } from './validate-csp.mjs';

const SAMPLE = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://a.example; frame-src https://b.example;
  X-Frame-Options: SAMEORIGIN
`;

describe('parseCsp', () => {
  it('extracts directives and their sources', () => {
    const csp = parseCsp(SAMPLE);
    expect(csp.get('script-src')).toEqual(["'self'", 'https://a.example']);
    expect(csp.get('frame-src')).toEqual(['https://b.example']);
  });

  it('returns an empty map when no CSP header is present', () => {
    expect(parseCsp('/*\n  X-Frame-Options: DENY\n').size).toBe(0);
  });
});

describe('findViolations', () => {
  it('reports a required origin missing from its directive', () => {
    const csp = parseCsp(SAMPLE);
    expect(findViolations(csp, [{ origin: 'https://c.example', directive: 'script-src' }]))
      .toEqual(['script-src is missing https://c.example']);
  });

  it('reports nothing when every required origin is present', () => {
    const csp = parseCsp(SAMPLE);
    expect(findViolations(csp, [{ origin: 'https://a.example', directive: 'script-src' }]))
      .toEqual([]);
  });

  it('reports a directive that is absent entirely', () => {
    const csp = parseCsp(SAMPLE);
    expect(findViolations(csp, [{ origin: 'https://x.example', directive: 'connect-src' }]))
      .toEqual(['connect-src is missing https://x.example']);
  });
});
