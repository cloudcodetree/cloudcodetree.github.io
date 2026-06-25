#!/usr/bin/env node
/**
 * scaffold-tutorial.mjs — create a new tutorial stub the right way, every time.
 * The deterministic half of the create-tutorial skill (the judgment half — writing
 * the real content, testing verified code, checking anchored links — stays with you).
 *
 * Given a slug/series/subtitle, it:
 *   1. appends a correctly-shaped entry to app/tutorials/manifest.ts (as the next
 *      part of the series; order = next global),
 *   2. bumps every existing sibling's "(Part k of M)" title to the new total,
 *   3. writes app/tutorials/(article)/<slug>/page.mdx from a type-aware template
 *      (composed title, OG image, <TutorialHero>, the right callout),
 *   4. regenerates the branded cover (manifest-driven),
 *   5. for --type verified, optionally scaffolds the companion repo.
 *
 * Usage:
 *   node scripts/scaffold-tutorial.mjs <slug> --series "RAG from Scratch" \
 *        --title "Reranking" [--type verified|anchored] [--excerpt "…"] \
 *        [--tags "Tutorial,RAG,Python"] [--read 10] [--date MM-DD-YYYY] \
 *        [--order N] [--with-repo]
 *
 * It never commits. Build + commit are the skill's final steps.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, MANIFEST, readTutorials, seriesTotal } from './lib/tutorials-data.mjs';

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) o[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else o._.push(a);
  }
  return o;
}

const die = (msg) => { console.error('✗ ' + msg); process.exit(1); };
const jsStr = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const args = parseArgs(process.argv.slice(2));
const slug = args._[0];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) die('slug required: lowercase letters, digits, hyphens (e.g. reranking-for-rag)');
const series = typeof args.series === 'string' ? args.series : null;
const title = typeof args.title === 'string' ? args.title : null;
if (!series) die('--series "Series Name" is required');
if (!title) die('--title "Subtitle" is required');
const type = args.type === 'anchored' ? 'anchored' : 'verified';

const tutorials = readTutorials();
if (tutorials.some((t) => t.slug === slug)) die(`slug already exists in the manifest: ${slug}`);
const mdxDir = path.join(ROOT, 'app/tutorials/(article)', slug);
if (existsSync(mdxDir)) die(`page already exists: ${path.relative(ROOT, mdxDir)}`);

const oldTotal = seriesTotal(tutorials, series);
const newTotal = oldTotal + 1;
const part = newTotal; // always append as the series' next/last part
const order = Number.isInteger(+args.order) && args.order !== true ? +args.order
  : (tutorials.reduce((m, t) => Math.max(m, t.order || 0), 0) + 1);
const today = new Date();
const date = typeof args.date === 'string' ? args.date
  : `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
const excerpt = typeof args.excerpt === 'string' ? args.excerpt : `TODO one-line summary of ${title}.`;
const tags = typeof args.tags === 'string' ? args.tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Tutorial'];
const readTime = Number.isInteger(+args.read) && args.read !== true ? +args.read : 10;
const composed = `${series}: ${title} (Part ${part} of ${newTotal})`;
const cover = `/tutorials/covers/${slug}.png`;

// 1) Bump every existing sibling's "(Part k of oldTotal)" → newTotal.
let bumped = 0;
if (oldTotal > 0) {
  for (const sib of tutorials.filter((t) => t.series === series)) {
    const f = path.join(ROOT, 'app/tutorials/(article)', sib.slug, 'page.mdx');
    if (!existsSync(f)) continue;
    const before = readFileSync(f, 'utf8');
    const after = before.replaceAll(`(Part ${sib.part} of ${oldTotal})`, `(Part ${sib.part} of ${newTotal})`);
    if (after !== before) { writeFileSync(f, after); bumped++; }
  }
}

// 2) Append the manifest entry before the array's closing `];`.
const src = readFileSync(MANIFEST, 'utf8');
const close = src.indexOf('\n];', src.indexOf('[', src.indexOf('=', src.indexOf('export const tutorials'))));
if (close === -1) die('could not locate the tutorials array close in manifest.ts');
const entry = `  {
    slug: '${jsStr(slug)}',
    title: '${jsStr(title)}',
    series: '${jsStr(series)}',
    part: ${part},
    excerpt:
      '${jsStr(excerpt)}',
    date: '${date}',
    tags: [${tags.map((t) => `'${jsStr(t)}'`).join(', ')}],
    order: ${order},
    readTime: ${readTime},
    image: '${cover}',
  },
`;
writeFileSync(MANIFEST, src.slice(0, close + 1) + entry + src.slice(close + 1));

// 3) Write the MDX from a type-aware template.
const L = [];
L.push('export const metadata = {');
L.push(`  title: '${jsStr(composed)} · Tutorials',`);
L.push('  description:');
L.push(`    '${jsStr(excerpt)}',`);
L.push(`  alternates: { canonical: 'https://cloudcodetree.com/tutorials/${slug}/' },`);
L.push('  openGraph: {');
L.push(`    title: '${jsStr(composed)}',`);
L.push(`    description: '${jsStr(excerpt)}',`);
L.push(`    url: 'https://cloudcodetree.com/tutorials/${slug}/',`);
L.push("    siteName: 'CloudCodeTree',");
L.push("    type: 'article',");
L.push(`    images: [{ url: '${cover}', width: 1200, height: 675 }],`);
L.push('  },');
L.push(`  twitter: { card: 'summary_large_image', images: ['${cover}'] },`);
L.push('};');
L.push('');
L.push(`<TutorialHero slug="${slug}" />`);
L.push('');
L.push(`# ${title}`);
L.push('');
L.push('**TL;DR: TODO — one-sentence promise of what the reader will do or learn.**');
L.push('');
L.push('TODO — intro paragraph: where this sits in the series and why it matters.');
L.push('');
if (type === 'verified') {
  L.push('<Callout tone="tip">');
  L.push('**Code along, version by version.** Full project at');
  L.push(`[github.com/cloudcodetree/tutorial-${slug}](https://github.com/cloudcodetree/tutorial-${slug}).`);
  L.push(`Each step is a git tag — \`git checkout step-01\`, \`step-02\`, … — or [diff what each adds](https://github.com/cloudcodetree/tutorial-${slug}#steps-and-what-each-adds).`);
  L.push('</Callout>');
} else {
  L.push('<Callout tone="warn">');
  L.push('**This runs on a GPU, not your laptop.** Read here for the concepts; **run** it in');
  L.push('the official notebook linked below. This page ships no "tested locally" output.');
  L.push('</Callout>');
  L.push('');
  L.push('<Callout tone="tip">');
  L.push('**Run it — the official notebook:** [TODO notebook title](TODO-verify-this-url-is-live).');
  L.push('</Callout>');
}
L.push('');
L.push("## What you'll be able to do after this");
L.push('');
L.push('- TODO');
L.push('- TODO');
L.push('');
L.push('## TODO — first section');
L.push('');
L.push('TODO. (Verified: every code block + result must be from a real run. Anchored: mark snippets illustrative.)');
L.push('');
L.push('## Where this goes next');
L.push('');
L.push('- TODO');
L.push('');
L.push('---');
L.push('');
L.push('*Sources: TODO*');
L.push('');
mkdirSync(mdxDir, { recursive: true });
writeFileSync(path.join(mdxDir, 'page.mdx'), L.join('\n'));

// 4) Regenerate covers (now manifest-driven — picks up the new entry).
execFileSync('node', ['scripts/generate-tutorial-covers.mjs'], { cwd: ROOT, stdio: 'pipe' });

// 5) Optional companion repo (verified only).
if (args['with-repo'] && type === 'verified') {
  execFileSync('node', ['scripts/new-tutorial-repo.mjs', slug, '--title', composed], { cwd: ROOT, stdio: 'inherit' });
}

console.log(`✓ scaffolded "${composed}"`);
console.log(`  manifest: appended entry (part ${part}, order ${order})${bumped ? `; bumped ${bumped} sibling title(s) to "of ${newTotal}"` : ''}`);
console.log(`  page:     app/tutorials/(article)/${slug}/page.mdx  (fill the TODOs)`);
console.log(`  cover:    public/tutorials/covers/${slug}.png`);
if (type === 'verified' && !args['with-repo']) console.log(`  repo:     run with --with-repo, or: node scripts/new-tutorial-repo.mjs ${slug} --title "${composed}" --create-remote`);
console.log('\nNext: write the content, then `pnpm build` and commit.');
