#!/usr/bin/env node
/**
 * fetch-demo-artifacts.mjs — vendor each live demo's build into
 * out/projects/<slug>/demo/ after `next build`.
 *
 * The manifest's `demo.artifact` pins WHAT ships: a commit SHA (interim: clone
 * + build here with vite's --base override, zero changes needed in the demo
 * repo) or, later, a release tag whose prebuilt asset we download. A pinned
 * artifact in the manifest is a submodule pointer without the git plumbing:
 * which demo version is live is a reviewable line in a diff.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readProjects } from './lib/projects-data.mjs';

const OUT = path.resolve('out');
const CACHE = path.resolve('.demo-build-cache');

const live = readProjects().filter((p) => p.demoStatus === 'live' && p.artifact);
if (live.length === 0) {
  console.log('no live demos in the manifest — nothing to vendor');
  process.exit(0);
}
if (!existsSync(OUT)) {
  console.error('✗ out/ missing — run next build first');
  process.exit(1);
}

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });

for (const p of live) {
  const base = `/projects/${p.slug}/demo/`;
  const repoName = p.demoRepo ?? p.slug;
  const repo = `https://github.com/cloudcodetree/${repoName}.git`;
  const strategy = p.strategy ?? 'vite';
  const work = path.join(CACHE, `${p.slug}-${p.artifact.slice(0, 12)}`);
  // vite builds land in dist/; static repos ARE the artifact.
  const built = strategy === 'static' ? work : path.join(work, 'dist');

  if (!existsSync(built) || (strategy === 'static' && !existsSync(path.join(work, '.git')))) {
    console.log(`▸ ${p.slug}: ${strategy} ${p.artifact.slice(0, 12)} (base ${base})`);
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    run('git', ['clone', '--quiet', repo, work]);
    run('git', ['checkout', '--quiet', p.artifact], work);
    if (strategy === 'vite') {
      run('npm', ['ci', '--silent', '--no-audit', '--no-fund'], work);
      // --base on the CLI overrides the repo's hardcoded vite `base`.
      run('npx', ['vite', 'build', '--base', base], work);
    }
  } else {
    console.log(`▸ ${p.slug}: cached ${p.artifact.slice(0, 12)}`);
  }

  const dest = path.join(OUT, 'projects', p.slug, 'demo');
  rmSync(dest, { recursive: true, force: true });
  cpSync(built, dest, { recursive: true, filter: (src) => !src.includes('/.git') });
  console.log(`✓ ${p.slug} → out/projects/${p.slug}/demo/`);
}
