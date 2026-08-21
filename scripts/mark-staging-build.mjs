#!/usr/bin/env node
/**
 * mark-staging-build.mjs — make a build unindexable.
 *
 * Applied to the built out/_headers rather than set by the Worker, because the
 * Worker only runs for run_worker_first paths and asset misses. A Worker-set
 * header would miss every ordinary page. Production never runs this script.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MARKER = 'X-Robots-Tag: noindex, nofollow';
const RULE = `

# --- staging only: never index this origin ---
/*
  ${MARKER}
`;

export async function appendNoindexRule(outDir) {
  const file = path.join(outDir, '_headers');
  const current = await readFile(file, 'utf8');
  if (current.includes(MARKER)) return 'already-present';
  await writeFile(file, current + RULE);
  return 'appended';
}

async function main() {
  const outDir = process.argv[2] ?? 'out';
  console.log(`✓ staging noindex rule ${await appendNoindexRule(outDir)} in ${outDir}/_headers`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
