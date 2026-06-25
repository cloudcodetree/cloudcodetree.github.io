// Shared reader for app/tutorials/manifest.ts so scripts have a single source of
// truth for the tutorial list (used by generate-tutorial-covers.mjs and
// scaffold-tutorial.mjs). The manifest is TypeScript, so we parse the entry
// object literals rather than import it. Relies on the manifest's stable shape:
// one flat object per tutorial inside `export const tutorials: Tutorial[] = [ … ]`.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MANIFEST = path.join(ROOT, 'app/tutorials/manifest.ts');

/** Locate the `tutorials` array body within the manifest source. */
function arrayBounds(src) {
  const decl = src.indexOf('export const tutorials');
  if (decl === -1) throw new Error('manifest: `export const tutorials` not found');
  // Skip past `=` so the `[` in the `Tutorial[]` type annotation isn't mistaken
  // for the array opener.
  const eq = src.indexOf('=', decl);
  const open = src.indexOf('[', eq);
  const close = src.indexOf('\n];', open);
  if (eq === -1 || open === -1 || close === -1) throw new Error('manifest: could not bound the tutorials array');
  return { open, close };
}

/** Parse the manifest into [{ slug, title, series, part, order }] (declaration order). */
export function readTutorials() {
  const src = readFileSync(MANIFEST, 'utf8');
  const { open, close } = arrayBounds(src);
  const body = src.slice(open + 1, close);
  const str = (chunk, k) => { const m = chunk.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)); return m ? m[1].replace(/\\'/g, "'") : undefined; };
  const num = (chunk, k) => { const m = chunk.match(new RegExp(`${k}:\\s*(\\d+)`)); return m ? Number(m[1]) : undefined; };
  return body
    .split(/\},\s*/)
    .map((c) => c.trim())
    .filter((c) => c.startsWith('{'))
    .map((c) => ({ slug: str(c, 'slug'), title: str(c, 'title'), series: str(c, 'series'), part: num(c, 'part'), order: num(c, 'order') }))
    .filter((t) => t.slug);
}

/** Number of tutorials in a series. */
export function seriesTotal(list, series) {
  return list.filter((t) => t.series === series).length;
}
