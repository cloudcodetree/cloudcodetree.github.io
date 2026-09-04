// Shared types and styling for the AI News blog (list + article views).

import { createElement, type AnchorHTMLAttributes } from 'react';
import type { Components } from 'react-markdown';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  /** Post body, Markdown, inlined in posts.json. */
  content?: string;
  author: string;
  date: string;
  /** Full publication timestamp (ISO 8601, from the feed's pubDate). */
  publishedAt?: string;
  tags: string[];
  readTime: number;
  dek?: string;
  /** Featured image — CDN URL on the blog-images GitHub Release. */
  image?: string;
  /** Where the featured image was sourced from (the article URL), for attribution. */
  imageSource?: string;
  /** Stock-photo credit (set when the image came from Pexels). */
  imageCredit?: string;
  imageCreditUrl?: string;
}

/** One pagination chunk emitted by scripts/generate-feeds.mjs → /blog/pages/<n>.json */
export interface BlogPageChunk {
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
  posts: BlogPost[];
}

// Industry display face (Barlow Condensed) — the name SERIF is kept so 40+
// call sites stay untouched; it now means "display type".
export const SERIF = 'var(--font-display), system-ui, sans-serif';
export const MONO = 'var(--font-plex-mono), ui-monospace, monospace';
export const ACCENT = '#94bce3'; // industry accent-400 on dark
export const LINK = '#94bce3'; // hover: #b5d9fd
export const ACCENT2 = '#ffb24d'; // redline amber — emphasis (owner amendment 2026-08-24)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "06-04-2026" → "Jun 4, 2026" */
export function formatLongDate(d: string): string {
  const [mm, dd, yyyy] = d.split('-').map(Number);
  if (!mm || !dd || !yyyy) return d;
  return `${MONTHS[mm - 1]} ${dd}, ${yyyy}`;
}

/**
 * Post date+time for the meta line: "Jun 11, 2026 · 18:33 UTC".
 * Rendered in UTC (not the viewer's timezone) deliberately — the string must
 * be identical on the build server and in the browser, or hydration breaks.
 * Falls back to the date-only form for pre-feed posts without a timestamp.
 */
export function formatPublished(post: Pick<BlogPost, 'date' | 'publishedAt'>): string {
  if (post.publishedAt) {
    const d = new Date(post.publishedAt);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mi = String(d.getUTCMinutes()).padStart(2, '0');
      return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} · ${hh}:${mi} UTC`;
    }
  }
  return formatLongDate(post.date);
}

/** react-markdown overrides: external links open in a new tab. */
function MarkdownLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//i.test(href ?? '') && !(href ?? '').startsWith('https://cloudcodetree.com');
  return createElement(
    'a',
    external ? { href, target: '_blank', rel: 'noopener noreferrer', ...rest } : { href, ...rest },
    children,
  );
}
import { BlueprintPre } from './Blueprint';
export const markdownComponents: Components = { a: MarkdownLink, pre: BlueprintPre };

/** Markdown rendering style shared by the feed and the article page. */
export const markdownSx = {
  lineHeight: 1.8,
  // Long URLs / inline code shouldn't push the layout wider than the screen.
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  // Title is rendered separately; hide a duplicate leading H1 in the body.
  '& h1:first-of-type': { display: 'none' },
  '& h1': { fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 600, mb: 2 },
  '& h2': { fontSize: { xs: '1.15rem', md: '1.3rem' }, fontWeight: 600, mt: 4, mb: 1.5, pl: 1.5, borderLeft: `3px solid ${ACCENT2}` },
  '& h3': { fontSize: { xs: '1.05rem', md: '1.15rem' }, fontWeight: 600, mt: 3, mb: 1 },
  '& p': { mb: 2, lineHeight: 1.8 },
  '& strong': { color: '#ffffff', fontWeight: 700 },
  '& a': { color: LINK, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
  '& blockquote': {
    m: '28px 0', p: '16px 20px', backgroundColor: '#2b2b2d', border: '1px solid #222a35',
    borderLeft: `3px solid ${LINK}`, borderRadius: 2, color: 'text.secondary', fontSize: '0.97rem',
    '& p': { m: 0 }, '& strong': { color: 'text.primary' },
  },
  '& hr': { border: 0, borderTop: '1px solid #222a35', my: 3 },
  '& hr + p': { color: 'text.secondary', fontSize: 13 },
  // Code blocks scroll horizontally instead of widening the page.
  // `pre` is rendered by BlueprintPre (frame + corner marks); only fallback
  // styling for non-component contexts remains here.
  '& pre': { maxWidth: '100%', overflowX: 'auto' },
  // Syntax highlighting (rehype-highlight). Readability first (owner
  // amendment 2026-08-24): proven GitHub-Dark-style token hues — maximum
  // differentiation on the graphite ground, familiar to every developer.
  '& .hljs-comment, & .hljs-quote': { color: '#8b949e', fontStyle: 'italic' },
  '& .hljs-keyword, & .hljs-selector-tag, & .hljs-doctag': { color: '#ff7b72' },
  '& .hljs-string, & .hljs-template-variable, & .hljs-addition': { color: '#a5d6ff' },
  '& .hljs-attr, & .hljs-attribute, & .hljs-variable': { color: '#79c0ff' },
  '& .hljs-number, & .hljs-literal, & .hljs-symbol, & .hljs-bullet': { color: '#ffb24d' },
  '& .hljs-title, & .hljs-section, & .hljs-function': { color: '#d2a8ff' },
  '& .hljs-name, & .hljs-built_in, & .hljs-type': { color: '#7ee787' },
  '& .hljs-params': { color: '#c9d1d9' },
  '& .hljs-meta': { color: '#79c0ff' },
  '& .hljs-deletion': { color: '#ffa198' },
  '& .hljs-emphasis': { fontStyle: 'italic' },
  '& .hljs-strong': { fontWeight: 700 },
  '& code': { backgroundColor: 'rgba(43,43,45, 0.6)', px: 1, py: 0.5, borderRadius: 0.5, fontFamily: 'monospace' },
  '& ul, & ol': { mb: 2, pl: 3 },
  '& li': { mb: 1, lineHeight: 1.8 },
  // Wide tables scroll within their own box.
  '& table': { display: 'block', maxWidth: '100%', overflowX: 'auto', borderCollapse: 'collapse' },
} as const;
