#!/usr/bin/env node
/**
 * apply-drafts.mjs — make the filesystem match the manifest's `draft` flags.
 *
 * Next.js only routes files named exactly page.<ext>, so a draft tutorial's
 * page.mdx is renamed to page.draft.mdx: still in the repo, reviewable,
 * but NOT built — the URL does not exist in the export. Flip `draft` off in
 * app/tutorials/manifest.ts and this restores page.mdx. Runs at prebuild.
 */
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { ROOT, readTutorials } from './lib/tutorials-data.mjs';
import { readProjects } from './lib/projects-data.mjs';

let hidden = 0, restored = 0;
const entries = [
  ...readTutorials().map((t) => ({ ...t, dir: path.join(ROOT, 'app', 'tutorials', '(article)', t.slug) })),
  ...readProjects().map((p) => ({ ...p, dir: path.join(ROOT, 'app', 'projects', '(detail)', p.slug) })),
];
for (const t of entries) {
  const dir = t.dir;
  const live = path.join(dir, 'page.mdx');
  const held = path.join(dir, 'page.draft.mdx');
  if (t.draft && existsSync(live)) { renameSync(live, held); hidden++; }
  else if (!t.draft && existsSync(held)) { renameSync(held, live); restored++; }
}
console.log(`✓ drafts applied: ${hidden} hidden, ${restored} restored`);
