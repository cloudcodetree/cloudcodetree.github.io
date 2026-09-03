#!/usr/bin/env node
/**
 * link-projects.mjs — (re)build the gitignored ./projects/ workspace:
 * one symlink per git repo cloned under ~/Development, so a session rooted
 * in this repo can navigate and edit sibling projects. Never checked in;
 * deploys never read it (they clone pinned SHAs from GitHub), so nothing
 * here can contaminate production.
 *
 * Also maintains companions/dealfinder → ~/Development/tutorial-dealfinder,
 * preserving the path the DealFinder curriculum documents (it was a git
 * submodule until 2026-08-25).
 *
 * Idempotent: prunes dead links, replaces wrong ones, leaves real files alone.
 */
import { readdirSync, existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const DEV = path.join(homedir(), 'Development');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WORKSPACE = path.join(ROOT, 'projects');
const SELF = path.resolve(ROOT);

function ensureLink(linkPath, target) {
  if (existsSync(linkPath) || isDeadLink(linkPath)) {
    const st = lstatSync(linkPath);
    if (!st.isSymbolicLink()) { console.warn(`· skip ${linkPath} (real file/dir)`); return 'skipped'; }
    if (readlinkSync(linkPath) === target) return 'ok';
    unlinkSync(linkPath);
  }
  symlinkSync(target, linkPath);
  return 'linked';
}
function isDeadLink(p) {
  try { lstatSync(p); return !existsSync(p); } catch { return false; }
}

mkdirSync(WORKSPACE, { recursive: true });

// Prune dead links first.
for (const name of readdirSync(WORKSPACE)) {
  const p = path.join(WORKSPACE, name);
  if (isDeadLink(p)) { unlinkSync(p); console.log(`✂ pruned dead link ${name}`); }
}

let linked = 0, ok = 0;
for (const name of readdirSync(DEV)) {
  const target = path.join(DEV, name);
  if (path.resolve(target) === SELF) continue;               // not ourselves
  let st; try { st = lstatSync(target); } catch { continue; }
  if (!st.isDirectory()) continue;
  if (!existsSync(path.join(target, '.git'))) continue;      // repos only
  const result = ensureLink(path.join(WORKSPACE, name), target);
  if (result === 'linked') { linked++; console.log(`+ projects/${name}`); }
  else if (result === 'ok') ok++;
}

// The documented curriculum path (ex-submodule).
mkdirSync(path.join(ROOT, 'companions'), { recursive: true });
const comp = ensureLink(path.join(ROOT, 'companions', 'dealfinder'), path.join(DEV, 'tutorial-dealfinder'));
console.log(`companions/dealfinder: ${comp}`);

console.log(`\n${linked} new link(s), ${ok} already correct.`);
