#!/usr/bin/env node
// Generates on-brand 16:9 cover images for each tutorial (dark gradient + accent
// + series / part / subtitle), written to public/tutorials/covers/<slug>.png.
// Run: node scripts/generate-tutorial-covers.mjs
// These are committed (a small, fixed set), unlike the blog's CDN-hosted images.

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const W = 1200, H = 675;
const ACCENT = '#3fb950';
const OUT = path.resolve('public/tutorials/covers');

// Kept in sync with app/tutorials/manifest.ts (small fixed set).
const SERIES = { 'RAG from Scratch': 6, 'Fine-Tuning & Serving': 3 };
const tutorials = [
  { slug: 'build-a-rag-over-your-blog', series: 'RAG from Scratch', title: 'Build a RAG Over Your Blog', part: 1 },
  { slug: 'vector-database-for-rag', series: 'RAG from Scratch', title: 'Give Your RAG a Vector Database', part: 2 },
  { slug: 'chunking-strategies-for-rag', series: 'RAG from Scratch', title: 'Chunking Strategies', part: 3 },
  { slug: 'hybrid-search-for-rag', series: 'RAG from Scratch', title: 'Hybrid Search', part: 4 },
  { slug: 'reranking-for-rag', series: 'RAG from Scratch', title: 'Reranking', part: 5 },
  { slug: 'evaluating-rag', series: 'RAG from Scratch', title: 'Evaluating Retrieval', part: 6 },
  { slug: 'fine-tuning-vs-rag', series: 'Fine-Tuning & Serving', title: 'Fine-Tuning vs RAG', part: 1 },
  { slug: 'lora-qlora-fine-tuning', series: 'Fine-Tuning & Serving', title: 'LoRA & QLoRA on One GPU', part: 2 },
  { slug: 'serve-with-vllm', series: 'Fine-Tuning & Serving', title: 'Serve a Model with vLLM', part: 3 },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Georgia bold runs wide (esp. caps/&), so estimate ~0.62em per glyph and
// leave headroom. Underestimating here is what clipped a title off the edge.
const FIT = 0.62;

// Greedy word-wrap to a max character count per line.
function wrapByChars(text, maxChars) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// Pick the largest font size that fits within maxW using the fewest lines
// (1 line preferred, up to maxLines). Guarantees no line overflows the width.
function fitTitle(title, maxW, maxLines = 2) {
  let best = null;
  for (const fontPx of [80, 74, 68, 62, 56, 50, 44]) {
    const maxChars = Math.floor(maxW / (fontPx * FIT));
    if (maxChars < 1) continue;
    const lines = wrapByChars(title, maxChars);
    if (lines.length > maxLines) continue;
    if (lines.some((l) => l.length > maxChars)) continue; // a single word too wide
    if (!best || lines.length < best.lines.length) best = { fontPx, lines };
  }
  if (best) return best;
  // Fallback: smallest size, wrap as best we can.
  const fontPx = 44;
  return { fontPx, lines: wrapByChars(title, Math.floor(maxW / (fontPx * FIT))) };
}

function svg({ series, title, part }) {
  const total = SERIES[series];
  const pad = 90;
  const { fontPx, lines } = fitTitle(title, W - pad * 2, 2);
  const titleY = 312 - (lines.length - 1) * (fontPx * 0.58);
  const tspans = lines
    .map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : fontPx * 1.16}">${esc(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1117"/><stop offset="1" stop-color="#161b22"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.6">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="${pad}" y="150" width="56" height="4" fill="${ACCENT}"/>
  <text x="${pad}" y="200" font-family="Menlo, monospace" font-size="22" letter-spacing="5" fill="${ACCENT}">${esc(series.toUpperCase())}</text>
  <text x="${W - pad}" y="200" text-anchor="end" font-family="Menlo, monospace" font-size="22" letter-spacing="3" fill="#8b98a8">PART ${part} / ${total}</text>
  <text y="${titleY}" font-family="Georgia, serif" font-weight="bold" font-size="${fontPx}" fill="#ffffff">${tspans}</text>
  <text x="${pad}" y="601" font-family="Menlo, monospace" font-size="20" fill="#8b98a8">cloudcodetree.com/tutorials</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
for (const t of tutorials) {
  const buf = Buffer.from(svg(t));
  const out = path.join(OUT, `${t.slug}.png`);
  await sharp(buf).png().toFile(out);
  console.log('wrote', path.relative(process.cwd(), out));
}
console.log(`\n${tutorials.length} covers generated.`);
