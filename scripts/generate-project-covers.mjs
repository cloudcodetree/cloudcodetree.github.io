#!/usr/bin/env node
// Generates on-brand 16:9 cover images for each project card, written to
// public/projects/covers/<slug>.png. Committed (a small, fixed set), same
// precedent as the tutorial covers. Run: node scripts/generate-project-covers.mjs
// Adapted from scripts/generate-tutorial-covers.mjs.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readProjects } from './lib/projects-data.mjs';

const W = 1200, H = 675;
const OUT = path.resolve('public/projects/covers');

// Per-project identity: accent color + a domain glyph (large faint line art on
// the right, clear of the title block).
const STYLE = {
  'nam-app': { accent: '#b5d9fd', glyph: 'wave' },
  'motion-expression': { accent: '#94bce3', glyph: 'pulse' },
  'backlot': { accent: '#749dc4', glyph: 'chat' },
  'homestead-finder': { accent: '#94bce3', glyph: 'house' },
  'span-calculator': { accent: '#b5d9fd', glyph: 'beam' },
  'mac-desktop-navigator': { accent: '#749dc4', glyph: 'spaces' },
  'midea-mini-split-tools': { accent: '#94bce3', glyph: 'flake' },
  'code-compare': { accent: '#749dc4', glyph: 'brackets' },
};
const DEFAULT_STYLE = { accent: '#94bce3', glyph: null };

const GLYPHS = {
  wave: (a) => `<g transform="translate(870,340)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <path d="M0,0 L0,-40 M40,0 L40,-95 M80,0 L80,-55 M120,0 L120,-130 M160,0 L160,-75 M200,0 L200,-110 M240,0 L240,-45"/>
    <path d="M0,10 L0,50 M40,10 L40,105 M80,10 L80,65 M120,10 L120,140 M160,10 L160,85 M200,10 L200,120 M240,10 L240,55"/></g>`,
  pulse: (a) => `<g transform="translate(860,340)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <path d="M0,0 h60 l25,-90 l40,180 l35,-130 l25,40 h75"/><circle cx="270" cy="0" r="14"/></g>`,
  chat: (a) => `<g transform="translate(880,270)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <rect x="0" y="0" width="200" height="130" rx="18"/><path d="M55,130 L45,175 L105,130"/>
    <line x1="35" y1="45" x2="165" y2="45"/><line x1="35" y1="85" x2="130" y2="85"/></g>`,
  house: (a) => `<g transform="translate(890,265)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <path d="M0,95 L105,0 L210,95"/><path d="M25,80 V190 H185 V80"/><rect x="85" y="120" width="45" height="70"/></g>`,
  beam: (a) => `<g transform="translate(870,280)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <line x1="0" y1="0" x2="250" y2="0"/><line x1="0" y1="120" x2="250" y2="120"/><line x1="125" y1="0" x2="125" y2="120"/>
    <line x1="0" y1="165" x2="250" y2="165"/><path d="M18,150 L18,180 M232,150 L232,180"/></g>`,
  spaces: (a) => `<g transform="translate(880,300)" stroke="${a}" stroke-width="6" opacity="0.45">
    <rect x="0" y="0" width="62" height="42" rx="6" fill="none"/><rect x="78" y="0" width="62" height="42" rx="6" fill="${a}"/>
    <rect x="156" y="0" width="62" height="42" rx="6" fill="none"/><rect x="0" y="60" width="62" height="42" rx="6" fill="none"/>
    <rect x="78" y="60" width="62" height="42" rx="6" fill="none"/><rect x="156" y="60" width="62" height="42" rx="6" fill="none"/></g>`,
  flake: (a) => `<g transform="translate(985,330)" stroke="${a}" stroke-width="6" fill="none" opacity="0.45">
    <line x1="0" y1="-110" x2="0" y2="110"/><line x1="-95" y1="-55" x2="95" y2="55"/><line x1="-95" y1="55" x2="95" y2="-55"/>
    <path d="M-22,-80 L0,-58 L22,-80 M-22,80 L0,58 L22,80 M-88,-18 L-66,-38 M-88,18 L-66,38 M88,-18 L66,-38 M88,18 L66,38"/></g>`,
  brackets: (a) => `<g transform="translate(880,290)" stroke="${a}" stroke-width="7" fill="none" opacity="0.45">
    <path d="M60,0 C20,0 45,70 0,70 C45,70 20,140 60,140"/><path d="M180,0 C220,0 195,70 240,70 C195,70 220,140 180,140"/>
    <line x1="100" y1="105" x2="140" y2="35"/></g>`,
};

const projects = readProjects();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FIT = 0.62;

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

function fitTitle(title, maxW, maxLines = 2) {
  let best = null;
  for (const fontPx of [80, 74, 68, 62, 56, 50, 44]) {
    const maxChars = Math.floor(maxW / (fontPx * FIT));
    if (maxChars < 1) continue;
    const lines = wrapByChars(title, maxChars);
    if (lines.length > maxLines) continue;
    if (lines.some((l) => l.length > maxChars)) continue;
    if (!best || lines.length < best.lines.length) best = { fontPx, lines };
  }
  if (best) return best;
  const fontPx = 44;
  return { fontPx, lines: wrapByChars(title, Math.floor(maxW / (fontPx * FIT))) };
}

function svg({ slug, title }) {
  const style = STYLE[slug] || DEFAULT_STYLE;
  const accent = style.accent;
  const pad = 90;
  const { fontPx, lines } = fitTitle(title, W - pad * 2 - 250, 2);
  const titleY = 312 - (lines.length - 1) * (fontPx * 0.58);
  const tspans = lines
    .map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : fontPx * 1.16}">${esc(l)}</tspan>`)
    .join('');
  const glyph = style.glyph && GLYPHS[style.glyph] ? GLYPHS[style.glyph](accent) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d1f20"/><stop offset="1" stop-color="#26282a"/>
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
  <text x="${pad}" y="200" font-family="Menlo, monospace" font-size="22" letter-spacing="5" fill="${accent}">PROJECT</text>
  <text y="${titleY}" font-family="Barlow Condensed, Arial Narrow, Helvetica Neue, sans-serif" font-weight="600" font-size="${fontPx}" fill="#ffffff">${tspans}</text>
  <text x="${pad}" y="601" font-family="Menlo, monospace" font-size="20" fill="#8b98a8">cloudcodetree.com/projects</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
for (const p of projects) {
  const out = path.join(OUT, `${p.slug}.png`);
  await sharp(Buffer.from(svg(p))).png().toFile(out);
  console.log('wrote', path.relative(process.cwd(), out));
}
console.log(`\n${projects.length} covers generated.`);
