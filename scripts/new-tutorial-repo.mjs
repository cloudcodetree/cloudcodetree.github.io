#!/usr/bin/env node
/**
 * new-tutorial-repo.mjs — scaffold a step-tagged companion code repo for a
 * hands-on tutorial, following the convention in docs/tutorials-playbook.md.
 *
 * Creates a sibling repo `tutorial-<slug>` with a standard README (step compare
 * table), starter files, and an initial `step-01` commit + annotated tag. The
 * GitHub repo is only created when you pass --create-remote (an outward action).
 *
 * Usage:
 *   node scripts/new-tutorial-repo.mjs <slug> --title "Human Title" \
 *        [--desc "one-liner"] [--dir <path>] [--create-remote]
 *
 * Then: build the code step by step, committing + `git tag -a step-NN -m "..."`
 * at each stage; push tags; add a row per step to the README compare table.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OWNER = 'cloudcodetree';

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else o._.push(a);
  }
  return o;
}

const args = parseArgs(process.argv.slice(2));
const slug = args._[0];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: node scripts/new-tutorial-repo.mjs <slug> --title "..." [--desc "..."] [--dir <path>] [--create-remote]');
  console.error('  <slug> must be lowercase letters, digits, hyphens (e.g. lora-on-colab)');
  process.exit(1);
}
const repo = `tutorial-${slug}`;
const title = typeof args.title === 'string' ? args.title : slug.replace(/-/g, ' ');
const desc = typeof args.desc === 'string' ? args.desc
  : `Hands-on ${title} — work through it step by step via git tags. Companion to cloudcodetree.com/tutorials.`;
const dir = path.resolve(typeof args.dir === 'string' ? args.dir : path.join(ROOT, '..', repo));
const GH = `https://github.com/${OWNER}/${repo}`;

if (existsSync(dir)) { console.error(`✗ ${dir} already exists`); process.exit(1); }

const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });

mkdirSync(dir, { recursive: true });
git('init', '-q', '-b', 'main');

writeFileSync(path.join(dir, 'README.md'), `# ${title}

Companion code for the tutorial at
[cloudcodetree.com/tutorials/${slug}](https://cloudcodetree.com/tutorials/${slug}/).

Work through it **version by version** — each step is a git tag:

\`\`\`bash
git clone ${GH} && cd ${repo}
git checkout step-01     # then step-02, step-03, ...
\`\`\`

## Steps (and what each adds)

| Step | What you add | See the diff |
|---|---|---|
| \`step-01\` | Project setup + scaffolding | — |
<!-- add a row per step, e.g.:
| \`step-02\` | <what it adds> | [step-01…step-02](${GH}/compare/step-01...step-02) |
-->

\`main\` is the finished version.
`);

writeFileSync(path.join(dir, '.gitignore'), '.venv/\nnode_modules/\n__pycache__/\n');
writeFileSync(path.join(dir, 'START_HERE.md'), `# ${title}\n\nStarting point. Build the tutorial here, committing and tagging each step:\n\n    git add -A && git commit -m "step N: <what>"\n    git tag -a step-0N -m "Step N - <what it adds>"\n`);

git('add', '-A');
git('-c', 'user.name=Chris Harper', '-c', 'user.email=chris@cloudcodetree.com', 'commit', '-q', '-m', 'step 1: project setup + scaffolding');
git('tag', '-a', 'step-01', '-m', 'Step 1 - project setup and scaffolding');

console.log(`✓ scaffolded ${dir}`);
console.log(`  branch main, tag step-01`);

if (args['create-remote']) {
  console.log(`\nCreating public GitHub repo ${OWNER}/${repo} …`);
  execFileSync('gh', ['repo', 'create', `${OWNER}/${repo}`, '--public', '--description', desc, '--source', dir, '--remote', 'origin'], { stdio: 'inherit' });
  execFileSync('git', ['push', '-u', 'origin', 'main'], { cwd: dir, stdio: 'inherit' });
  execFileSync('git', ['push', 'origin', '--tags'], { cwd: dir, stdio: 'inherit' });
  console.log(`✓ pushed → ${GH}`);
} else {
  console.log(`\nNot created on GitHub (pass --create-remote to do that). When ready:`);
  console.log(`  gh repo create ${OWNER}/${repo} --public --source ${dir} --remote origin --push`);
  console.log(`  git -C ${dir} push origin --tags`);
}

console.log(`\nNext:`);
console.log(`  1. Build the code, committing + 'git tag -a step-NN -m ...' per step; push --tags.`);
console.log(`  2. Add README compare-table rows as you tag steps.`);
console.log(`  3. Site side: create app/tutorials/(article)/${slug}/page.mdx and add an`);
console.log(`     entry to app/tutorials/manifest.ts (see docs/tutorials-playbook.md).`);
