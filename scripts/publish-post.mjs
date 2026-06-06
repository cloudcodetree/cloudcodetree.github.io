#!/usr/bin/env node
/**
 * publish-post.mjs — the blog publishing core.
 *
 * Turns a markdown draft into a published blog post:
 *   1. strips YAML frontmatter (published .md must be frontmatter-free — it is
 *      rendered raw by react-markdown, so frontmatter would show as literal text),
 *   2. derives metadata (id, title, excerpt, tags, readTime, date),
 *   3. writes the body to public/blog/<id>.md,
 *   4. upserts the entry into public/blog/posts.json (newest-first, deduped by id),
 *   5. validates the result.
 *
 * Usage:
 *   node scripts/publish-post.mjs <draft.md> [--tags a,b] [--date MM-DD-YYYY]
 *        [--author "Name"] [--id slug] [--title "..."] [--commit]
 *   node scripts/publish-post.mjs --intake <dir> [--commit]
 *
 * Also importable: `import { publishOne } from './publish-post.mjs'`.
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'public', 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const DEFAULT_AUTHOR = 'Chris Harper';

// --- pure helpers ----------------------------------------------------------

/** Split `---\n...\n---\n` YAML frontmatter from the markdown body. */
export function parseFrontmatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text.replace(/^﻿/, '') };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) {
      v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, '');
    }
    data[kv[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'post';
}

export function estimateReadTime(body) {
  const words = body.replace(/[#>*`_\-\[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** First real paragraph after the H1, stripped of markdown, truncated ~200 chars. */
export function deriveExcerpt(body, max = 200) {
  const paras = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('>') && !p.startsWith('---'));
  let p = paras[0] || '';
  p = p
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (p.length <= max) return p;
  return p.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

const TAG_RULES = [
  [/\bkubernetes|k8s\b/i, 'Kubernetes'],
  [/\bmicroservice/i, 'Microservices'],
  [/\baws\b|amazon web services/i, 'AWS'],
  [/\breact\b/i, 'React'],
  [/\btypescript\b/i, 'TypeScript'],
  [/\bsecurity|owasp|vulnerab/i, 'Security'],
  [/\bllm|gpt|claude|anthropic|openai|model\b/i, 'LLM'],
  [/\bagent|subagent|copilot|cursor\b/i, 'AI'],
  [/\bdevops|ci\/cd|pipeline\b/i, 'DevOps'],
  [/\bcloud\b/i, 'Cloud'],
  [/\bbest practice|workflow|productivity\b/i, 'Best Practices'],
];

export function inferTags(body) {
  const tags = [];
  for (const [re, tag] of TAG_RULES) if (re.test(body) && !tags.includes(tag)) tags.push(tag);
  if (tags.length === 0) tags.push('AI', 'Developer Tools');
  return tags.slice(0, 4);
}

export function formatDate(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function titleFromBody(body) {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : null;
}

// --- core ------------------------------------------------------------------

async function readPosts() {
  if (!existsSync(POSTS_JSON)) return [];
  return JSON.parse(await readFile(POSTS_JSON, 'utf8'));
}

async function writePosts(posts) {
  await writeFile(POSTS_JSON, JSON.stringify(posts, null, 2) + '\n');
}

/**
 * Publish a single draft markdown file. Returns the created post entry.
 * @param {string} srcPath path to the draft markdown
 * @param {object} [opts] { id, title, author, date, tags, type }
 */
export async function publishOne(srcPath, opts = {}) {
  const raw = await readFile(srcPath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const cleanBody = body.replace(/^\s+/, '').replace(/\s+$/, '') + '\n';

  const title = opts.title || data.title || titleFromBody(cleanBody);
  if (!title) throw new Error(`No title found in ${srcPath} (need frontmatter title or an H1)`);

  const id = slugify(opts.id || data.id || path.basename(srcPath).replace(/\.md$/i, '') || title);
  const tags = opts.tags || (Array.isArray(data.tags) ? data.tags : undefined) || inferTags(cleanBody);
  const entry = {
    id,
    title,
    excerpt: opts.excerpt || data.excerpt || deriveExcerpt(cleanBody),
    author: opts.author || data.author || DEFAULT_AUTHOR,
    date: opts.date || data.date || formatDate(),
    tags,
    readTime: Number(opts.readTime || data.readTime || estimateReadTime(cleanBody)),
    filename: `${id}.md`,
  };

  // Optional presentation metadata (used by the AI Dev Brief design in BlogPage).
  const eyebrow = opts.eyebrow || data.eyebrow;
  const dek = opts.dek || data.dek;
  if (eyebrow) entry.eyebrow = eyebrow;
  if (dek) entry.dek = dek;

  await mkdir(BLOG_DIR, { recursive: true });
  await writeFile(path.join(BLOG_DIR, entry.filename), cleanBody);

  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  next.unshift(entry);
  await writePosts(next);

  console.log(`✓ published "${entry.title}" → public/blog/${entry.filename} (${entry.readTime} min, [${entry.tags.join(', ')}])`);
  return entry;
}

function gitCommit(entries) {
  const titles = entries.map((e) => e.title).join('; ');
  execFileSync('git', ['add', 'public/blog/'], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `blog: publish ${titles}`], { cwd: ROOT, stdio: 'inherit' });
}

// --- CLI -------------------------------------------------------------------

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      o[key] = val;
    } else o._.push(a);
  }
  if (typeof o.tags === 'string') o.tags = o.tags.split(',').map((s) => s.trim()).filter(Boolean);
  return o;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const published = [];

  if (args.intake) {
    const dir = path.resolve(String(args.intake));
    if (!existsSync(dir)) throw new Error(`Intake dir not found: ${dir}`);
    const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.md')).sort();
    if (files.length === 0) {
      console.log(`No .md drafts in ${dir} — nothing to publish.`);
      return;
    }
    for (const f of files) published.push(await publishOne(path.join(dir, f), args));
  } else if (args._[0]) {
    published.push(await publishOne(path.resolve(args._[0]), args));
  } else {
    console.error('Usage: node scripts/publish-post.mjs <draft.md> | --intake <dir> [--commit]');
    process.exit(1);
  }

  if (args.commit && published.length) gitCommit(published);
}

// Run as CLI only when invoked directly (portable across Node versions —
// import.meta.main is Node 24.2+ only, so compare argv[1] to this module path).
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((e) => {
    console.error('✗ publish failed:', e.message);
    process.exit(1);
  });
}
