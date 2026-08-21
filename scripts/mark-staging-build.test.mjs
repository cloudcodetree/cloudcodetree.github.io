import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { appendNoindexRule } from './mark-staging-build.mjs';

let dir;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'staging-'));
  await writeFile(path.join(dir, '_headers'), '/*\n  X-Frame-Options: SAMEORIGIN\n');
});

describe('appendNoindexRule', () => {
  it('appends a site-wide noindex rule', async () => {
    expect(await appendNoindexRule(dir)).toBe('appended');
    const text = await readFile(path.join(dir, '_headers'), 'utf8');
    expect(text).toContain('X-Robots-Tag: noindex, nofollow');
    expect(text).toContain('X-Frame-Options: SAMEORIGIN');
  });

  it('is idempotent', async () => {
    await appendNoindexRule(dir);
    expect(await appendNoindexRule(dir)).toBe('already-present');
    const text = await readFile(path.join(dir, '_headers'), 'utf8');
    expect(text.match(/X-Robots-Tag/g)).toHaveLength(1);
  });
});
