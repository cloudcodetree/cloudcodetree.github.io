// Shared reader for app/projects/manifest.ts so scripts have a single source
// of truth for the project list (cover generator, feeds/sitemap). Mirrors
// scripts/lib/tutorials-data.mjs: the manifest is TypeScript, so we parse the
// flat object literals rather than import it.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MANIFEST = path.join(ROOT, 'app/projects/manifest.ts');

function arrayBounds(src) {
  const decl = src.indexOf('export const projects');
  if (decl === -1) throw new Error('manifest: `export const projects` not found');
  const eq = src.indexOf('=', decl);
  const open = src.indexOf('[', eq);
  const close = src.indexOf('\n];', open);
  if (eq === -1 || open === -1 || close === -1) throw new Error('manifest: could not bound the projects array');
  return { open, close };
}

/** Parse the manifest into flat project records (declaration order). */
export function readProjects() {
  const src = readFileSync(MANIFEST, 'utf8');
  const { open, close } = arrayBounds(src);
  const body = src.slice(open + 1, close);
  const str = (chunk, k) => {
    const m = chunk.match(new RegExp(`${k}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`));
    return m ? m[1].replace(/\\'/g, "'") : undefined;
  };
  const num = (chunk, k) => {
    const m = chunk.match(new RegExp(`${k}:\\s*(\\d+)`));
    return m ? Number(m[1]) : undefined;
  };
  return body
    .split(/\},\s*\{/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({
      slug: str(c, 'slug'),
      title: str(c, 'title'),
      summary: str(c, 'summary'),
      repoUrl: str(c, 'repoUrl'),
      externalUrl: str(c, 'externalUrl'),
      demoStatus: str(c, 'demoStatus'),
      cover: str(c, 'cover'),
      order: num(c, 'order'),
    }))
    .filter((p) => p.slug);
}
