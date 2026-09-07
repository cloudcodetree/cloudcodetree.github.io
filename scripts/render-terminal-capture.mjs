#!/usr/bin/env node
/**
 * render-terminal-capture.mjs — turn real terminal output into a lesson
 * screenshot, so a "capture" in a tutorial is exactly what the command
 * printed and nothing else.
 *
 *   node scripts/render-terminal-capture.mjs <output.png> --title "$ pytest -q tests/" < lines.txt
 *
 * Reads the lines from stdin (or --file <path>), draws them in a dark
 * terminal card with the title as the prompt line, and writes a PNG via
 * sharp (SVG → PNG). No fonts are embedded: the card uses the system
 * monospace stack, which is what a real terminal would show anyway.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const argv = process.argv.slice(2);
const out = argv.find((a) => !a.startsWith('--'));
const arg = (name) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : undefined; };
if (!out) { console.error('usage: render-terminal-capture.mjs <output.png> [--title "$ cmd"] [--file lines.txt] [--width 1200]'); process.exit(2); }

const title = arg('--title') ?? '$';
const width = Number(arg('--width') ?? 1200);
const source = arg('--file') ? readFileSync(arg('--file'), 'utf8') : readFileSync(0, 'utf8');
const lines = source.replace(/\s+$/, '').split('\n').map((l) => l.replace(/\t/g, '    '));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fontSize = 20;
const lineHeight = 30;
const padX = 40;
const top = 92;
const height = top + lines.length * lineHeight + 48;
const colorFor = (l) => (/ passed/.test(l) && !/failed/.test(l) ? '#8ce99a' : /failed|error/i.test(l) ? '#ff8787' : /skipped/.test(l) ? '#ffd43b' : '#d8dee9');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" rx="14" fill="#0f1419"/>
  <rect x="0" y="0" width="100%" height="44" rx="14" fill="#1a2028"/>
  <circle cx="24" cy="22" r="6" fill="#ff5f57"/><circle cx="46" cy="22" r="6" fill="#febc2e"/><circle cx="68" cy="22" r="6" fill="#28c840"/>
  <text x="${padX}" y="${top - 30}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="#94bce3">${esc(title)}</text>
  ${lines.map((l, i) => `<text x="${padX}" y="${top + i * lineHeight}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="${colorFor(l)}" xml:space="preserve">${esc(l)}</text>`).join('\n  ')}
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, png);
console.log(`✓ ${out} (${width}×${height}, ${lines.length} lines, ${(png.length / 1024).toFixed(0)} KB)`);
