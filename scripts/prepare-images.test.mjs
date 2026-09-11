import { test, expect } from 'vitest';
import { mkdtemp, mkdir, copyFile, symlink, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
const run = promisify(execFile);

test('image preparation emits a JPEG manifest without credentials or changing posts', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cct-image-prepare-'));
  try {
    await mkdir(path.join(dir, 'scripts/lib'), { recursive: true });
    await mkdir(path.join(dir, 'public/blog'), { recursive: true });
    await mkdir(path.join(dir, 'content'), { recursive: true });
    await copyFile('scripts/ingest-feed.mjs', path.join(dir, 'scripts/ingest-feed.mjs'));
    await copyFile('scripts/lib/r2.mjs', path.join(dir, 'scripts/lib/r2.mjs'));
    await symlink(path.resolve('node_modules'), path.join(dir, 'node_modules'));
    const source = 'https://example.invalid/article';
    const id = '2026-09-10-image-fixture';
    const original = JSON.stringify([{ id, title: 'Fixture', date: '09-10-2026', tags: ['AI'], content: 'Fixture', image: 'https://img.cloudcodetree.com/_default.png', imageSource: source }]);
    await writeFile(path.join(dir, 'public/blog/posts.json'), original);
    const jpeg = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#123456' } }).jpeg().toBuffer();
    const image = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    await writeFile(path.join(dir, 'content/feed.xml'), `<rss><channel><item><guid>${id}</guid><title>Fixture</title><link>${source}</link><pubDate>Thu, 10 Sep 2026 00:00:00 GMT</pubDate><content:encoded>Fixture</content:encoded><media:content url="${image}" /></item></channel></rss>`);
    await run(process.execPath, ['scripts/ingest-feed.mjs', '--prepare-images=prepared'], { cwd: dir, env: { PATH: process.env.PATH } });
    expect(await readFile(path.join(dir, 'public/blog/posts.json'), 'utf8')).toBe(original);
    expect(JSON.parse(await readFile(path.join(dir, 'prepared/manifest.json'), 'utf8'))).toEqual([{ id, imageSource: source }]);
    const output = await sharp(path.join(dir, `prepared/${id}.jpg`)).metadata();
    expect(output.format).toBe('jpeg');
    expect(output.width).toBeLessThanOrEqual(1200);
  } finally { await rm(dir, { recursive: true, force: true }); }
}, 20_000);
