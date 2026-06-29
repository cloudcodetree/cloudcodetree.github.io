#!/usr/bin/env node
// Generates on-brand 16:9 cover images for each tutorial (dark gradient + accent
// + series / part / subtitle), written to public/tutorials/covers/<slug>.png.
// Run: node scripts/generate-tutorial-covers.mjs
// These are committed (a small, fixed set), unlike the blog's CDN-hosted images.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readTutorials, seriesTotal } from './lib/tutorials-data.mjs';

const W = 1200, H = 675;
const OUT = path.resolve('public/tutorials/covers');

// Per-series visual identity: an accent color + a topic glyph, keyed by SERIES
// so every part of a series shares one look and different series look distinct.
const DEFAULT_STYLE = { accent: '#3fb950', glyph: null };
const SERIES_STYLE = {
  'RAG from Scratch': { accent: '#3fb950', glyph: 'database' },
  'Fine-Tuning & Serving': { accent: '#d29922', glyph: 'sliders' },
  'Claude Code Anywhere': { accent: '#2f81f7', glyph: 'terminal' },
};

// Large faint line-art glyphs on the right, clear of the title and PART x/y row.
const GLYPHS = {
  database: (a) => `<g transform="translate(965,355)" fill="none" stroke="${a}" stroke-width="6" opacity="0.45">
    <ellipse cx="0" cy="-78" rx="100" ry="32"/><path d="M-100,-78 V78 a100,32 0 0 0 200,0 V-78"/>
    <path d="M-100,-26 a100,32 0 0 0 200,0"/><path d="M-100,26 a100,32 0 0 0 200,0"/></g>`,
  sliders: (a) => `<g transform="translate(885,255)" stroke="${a}" stroke-width="6" fill="${a}" opacity="0.45">
    <line x1="0" y1="0" x2="0" y2="230"/><circle cx="0" cy="60" r="15"/>
    <line x1="72" y1="0" x2="72" y2="230"/><circle cx="72" cy="160" r="15"/>
    <line x1="144" y1="0" x2="144" y2="230"/><circle cx="144" cy="110" r="15"/>
    <line x1="216" y1="0" x2="216" y2="230"/><circle cx="216" cy="40" r="15"/></g>`,
  terminal: (a) => `<g transform="translate(875,285)" fill="none" stroke="${a}" stroke-width="6" opacity="0.45">
    <rect x="0" y="0" width="230" height="160" rx="12"/><line x1="0" y1="42" x2="230" y2="42"/>
    <polyline points="34,86 64,112 34,138"/><line x1="86" y1="138" x2="160" y2="138"/></g>`,
};

// Single source of truth: the tutorials list comes from app/tutorials/manifest.ts.
const tutorials = readTutorials();

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
  const total = seriesTotal(tutorials, series);
  const style = SERIES_STYLE[series] || DEFAULT_STYLE;
  const accent = style.accent;
  const pad = 90;
  const { fontPx, lines } = fitTitle(title, W - pad * 2 - 250, 2); // reserve right space for the glyph
  const titleY = 312 - (lines.length - 1) * (fontPx * 0.58);
  const tspans = lines
    .map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : fontPx * 1.16}">${esc(l)}</tspan>`)
    .join('');
  const glyph = style.glyph && GLYPHS[style.glyph] ? GLYPHS[style.glyph](accent) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1117"/><stop offset="1" stop-color="#161b22"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.2" r="0.7">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${glyph}
  <rect x="${pad}" y="150" width="56" height="4" fill="${accent}"/>
  <text x="${pad}" y="200" font-family="Menlo, monospace" font-size="22" letter-spacing="5" fill="${accent}">${esc(series.toUpperCase())}</text>
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
