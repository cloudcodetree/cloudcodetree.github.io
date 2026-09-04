#!/usr/bin/env node
/**
 * generate-vscode-theme.mjs — build the repo's workspace VS Code theme.
 *
 * Takes Wes Bos's Cobalt2 theme (pinned commit), moves every color through
 * OKLCH, and writes `.vscode/settings.json` so anyone opening this repo gets
 * the same look without installing anything:
 *
 *   1. The blue Cobalt2 surfaces become dark green/grey (TARGET_BG).
 *   2. Every other color is hue-rotated by the SAME angle the background
 *      moved, in OKLCH, so perceived brightness (and therefore contrast)
 *      is preserved — that is what keeps the palette readable.
 *   3. Eye-strain pass: no pure white text (MAX_L), accent chroma capped
 *      (ACCENT_CHROMA_MAX), neutrals tinted toward the background hue, and
 *      token foregrounds pushed to at least MIN_TEXT_CONTRAST against the
 *      editor background.
 *   4. Colors that carry meaning by hue (terminal ANSI, git, diff,
 *      error/warning) skip the rotation but still get the comfort pass.
 *
 * Usage:
 *   node scripts/generate-vscode-theme.mjs            # fetch Cobalt2 + write
 *   node scripts/generate-vscode-theme.mjs --dry-run  # print the mapping only
 *   node scripts/generate-vscode-theme.mjs --source path/to/cobalt2.json
 *
 * Tune the knobs below and re-run; the output file is generated and committed.
 */
import fs from 'node:fs';
import path from 'node:path';

// ─── Knobs ──────────────────────────────────────────────────────────────────
const COBALT2_COMMIT = 'c4e9574372b85afad1682ed0fdd1ac0411c62512'; // 2025-01-07
const COBALT2_URL = `https://raw.githubusercontent.com/wesbos/cobalt2-vscode/${COBALT2_COMMIT}/theme/cobalt2.json`;

const SOURCE_BG = '#193549'; // Cobalt2 editor.background — the anchor for the shift
const TARGET_BG = { C: 0.026, h: 155 }; // dark green/grey; L is inherited from SOURCE_BG
const ACCENT_CHROMA_MAX = 0.13; // Cobalt2 accents are ~0.19; 0.13 = vivid but not neon
const MAX_L = 0.9; // no pure-white text on a dark ground
const ACCENT_L_FLOOR = 0.74; // how far an accent may darken to keep its chroma (≈5.4:1 on the bg)
const NEUTRAL_TINT_C = 0.012; // greys/whites pick up a whisper of the bg hue
const MIN_TEXT_CONTRAST = 4.5; // WCAG AA for token foregrounds vs editor bg
const SURFACE_HUE_WINDOW = 35; // deg around the source bg hue that counts as "surface"
const SURFACE_CHROMA_MAX = 0.12; // above this it is an accent, not a surface

const BASE_THEME = 'Default Dark Modern'; // ships with VS Code; fills any key Cobalt2 leaves unset

// Keys whose *accent* colors mean something by hue → not rotated.
const SEMANTIC_KEY =
  /^terminal\.ansi|gitDecoration|editorGutter\.(added|deleted|modified)|diffEditor|editor(Error|Warning|Info|Hint)\.|problems|minimapGutter|^charts\.|^testing\.|debugIcon|statusBarItem\.(error|warning)|editorOverviewRuler\.(added|deleted|modified|error|warning|info|\w+Content)|inputValidation\.\w+Border|notifications?(Error|Warning|Info)|editorMarkerNavigation(Error|Warning|Info)|list\.(error|warning|invalid)|(error|warning|info)Foreground|debugConsole\.(error|warning|info)|^merge\./i;
const SEMANTIC_SCOPE = /\binvalid\b|markup\.(inserted|deleted|changed)|meta\.diff/i;

// ─── Color math (sRGB ⇄ OKLCH, Björn Ottosson's matrices) ──────────────────
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function parseHex(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((ch) => ch + ch).join('');
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : null };
}
function toHex({ r, g, b, a }) {
  const q = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${q(r)}${q(g)}${q(b)}${a === null ? '' : q(a)}`;
}
function rgbToOklch({ r, g, b }) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.hypot(A, B), h };
}
function oklchToRgb({ L, C, h }) {
  const A = C * Math.cos((h * Math.PI) / 180), B = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}
const inGamut = ({ r, g, b }) => [r, g, b].every((v) => v >= -1e-6 && v <= 1 + 1e-6);
function toGamut(lch) {
  if (inGamut(oklchToRgb(lch))) return lch;
  let lo = 0, hi = lch.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgb({ ...lch, C: mid }))) lo = mid; else hi = mid;
  }
  return { ...lch, C: lo };
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
function relLum({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrast(fg, bg) {
  const [a, b] = [relLum(fg), relLum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

// ─── The transform ──────────────────────────────────────────────────────────
const srcBg = rgbToOklch(parseHex(SOURCE_BG));
const targetBg = toGamut({ L: srcBg.L, C: TARGET_BG.C, h: TARGET_BG.h });
const HUE_SHIFT = TARGET_BG.h - srcBg.h;
const SURFACE_CHROMA_SCALE = targetBg.C / srcBg.C;
const editorBgRgb = oklchToRgb(targetBg);

/**
 * @param {string} hex        source color
 * @param {object} opts
 * @param {boolean} opts.semantic  hue carries meaning → do not rotate accents
 * @param {boolean} opts.text      token foreground → enforce MIN_TEXT_CONTRAST
 */
function transform(hex, { semantic = false, text = false } = {}) {
  const src = parseHex(hex);
  let lch = rgbToOklch(src);
  const isNeutral = lch.C < 0.01;
  const isSurface = !isNeutral && lch.C < SURFACE_CHROMA_MAX && hueDist(lch.h, srcBg.h) < SURFACE_HUE_WINDOW;
  let role = isNeutral ? 'neutral' : isSurface ? 'surface' : semantic ? 'semantic' : 'accent';

  if (isSurface) {
    lch = { ...lch, h: lch.h + HUE_SHIFT, C: lch.C * SURFACE_CHROMA_SCALE };
  } else if (isNeutral) {
    if (lch.L > 0.3) lch = { ...lch, C: NEUTRAL_TINT_C, h: TARGET_BG.h };
  } else if (!semantic) {
    lch = { ...lch, h: lch.h + HUE_SHIFT };
  }
  const wantC = Math.min(lch.C, ACCENT_CHROMA_MAX);
  lch = { ...lch, C: wantC, L: Math.min(lch.L, MAX_L) };
  let fitted = toGamut(lch);
  if (!isNeutral && !isSurface) {
    // Cobalt2's bright accents live at green/cyan/yellow hues, where sRGB has
    // plenty of room near L 0.9. Rotated into red/orange there is none — a bright
    // saturated peach does not exist — so plain clipping washes strings, support
    // and function names out to near-white. Trade lightness for chroma instead,
    // which also pulls accents out of the glare band. Contrast is re-checked below.
    while (fitted.C < wantC * 0.9 && fitted.L > ACCENT_L_FLOOR) {
      fitted = toGamut({ ...lch, L: fitted.L - 0.01 });
    }
  }
  lch = fitted;

  if (text && src.a === null) {
    // Raise lightness until the token reads comfortably against the editor bg.
    for (let i = 0; i < 60 && contrast(oklchToRgb(lch), editorBgRgb) < MIN_TEXT_CONTRAST; i++) {
      lch = toGamut({ ...lch, L: Math.min(MAX_L, lch.L + 0.01) });
      if (lch.L >= MAX_L) break;
    }
  }
  return { hex: toHex({ ...oklchToRgb(lch), a: src.a }), role, lch };
}

// ─── JSONC (Cobalt2's theme file has comments) ──────────────────────────────
function parseJsonc(src) {
  let out = '', i = 0, inStr = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === '"') inStr = false; i++; continue; }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

// ─── Main ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const srcIdx = args.indexOf('--source');
const theme = parseJsonc(
  srcIdx >= 0
    ? fs.readFileSync(args[srcIdx + 1], 'utf8')
    : await (await fetch(COBALT2_URL)).text(),
);

const report = new Map(); // "source hex|role" → { hex, role, lch } (a hex can be both semantic and accent)
const note = (from, res) => report.set(`${from.toLowerCase()}|${res.role}`, res);

const colors = {};
for (const [key, value] of Object.entries(theme.colors)) {
  const res = transform(value, { semantic: SEMANTIC_KEY.test(key) });
  colors[key] = res.hex;
  note(value, res);
}

const textMateRules = theme.tokenColors.map((rule) => {
  const scope = [].concat(rule.scope ?? []).join(',');
  const semantic = SEMANTIC_SCOPE.test(scope);
  const settings = { ...rule.settings };
  if (settings.foreground) {
    const res = transform(settings.foreground, { semantic, text: true });
    settings.foreground = res.hex; note(rule.settings.foreground, res);
  }
  if (settings.background) {
    const res = transform(settings.background, { semantic });
    settings.background = res.hex; note(rule.settings.background, res);
  }
  return { ...(rule.name ? { name: rule.name } : {}), scope: rule.scope, settings };
});

const semanticRules = {};
for (const [sel, value] of Object.entries(theme.semanticTokenColors ?? {})) {
  if (typeof value === 'string') {
    const res = transform(value, { text: true }); semanticRules[sel] = res.hex; note(value, res);
  } else {
    const out = { ...value };
    if (out.foreground) { const res = transform(out.foreground, { text: true }); out.foreground = res.hex; note(value.foreground, res); }
    semanticRules[sel] = out;
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────
const fmt = (n) => n.toFixed(2);
console.log(`Cobalt2 @ ${COBALT2_COMMIT.slice(0, 7)} → workspace theme`);
console.log(`hue shift ${HUE_SHIFT.toFixed(1)}°   surface chroma ×${fmt(SURFACE_CHROMA_SCALE)}   editor bg ${toHex({ ...editorBgRgb, a: null })}\n`);
const byRole = {};
for (const [key, res] of [...report.entries()].sort()) (byRole[res.role] ??= []).push([key.split('|')[0], res]);
for (const role of ['surface', 'neutral', 'accent', 'semantic']) {
  console.log(`— ${role}`);
  for (const [from, { hex, lch }] of byRole[role] ?? []) {
    const cr = parseHex(hex).a === null ? `${fmt(contrast(oklchToRgb(lch), editorBgRgb)).padStart(5)}:1` : '   —   ';
    console.log(`  ${from.padEnd(10)} → ${hex.padEnd(10)}  L ${fmt(lch.L)} C ${fmt(lch.C)} h ${lch.h.toFixed(0).padStart(3)}°  ${cr}`);
  }
}

if (dryRun) process.exit(0);

// ─── Write .vscode/settings.json (merge over any existing keys) ─────────────
const outPath = path.resolve('.vscode/settings.json');
let existing = {};
if (fs.existsSync(outPath)) existing = parseJsonc(fs.readFileSync(outPath, 'utf8'));
const settings = {
  ...existing,
  'workbench.colorTheme': BASE_THEME,
  'workbench.colorCustomizations': colors,
  'editor.tokenColorCustomizations': { textMateRules },
  'editor.semanticTokenColorCustomizations': { enabled: true, rules: semanticRules },
};
const header = [
  '// GENERATED — do not hand-edit. Rebuild with: node scripts/generate-vscode-theme.mjs',
  `// Cobalt2 (wesbos/cobalt2-vscode @ ${COBALT2_COMMIT.slice(0, 7)}) hue-shifted ${HUE_SHIFT.toFixed(0)}° in OKLCH`,
  `// onto a dark green/grey ground, accent chroma capped at ${ACCENT_CHROMA_MAX} for eye comfort.`,
  `// Base theme "${BASE_THEME}" only fills keys Cobalt2 leaves unset.`,
].join('\n');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${header}\n${JSON.stringify(settings, null, 2)}\n`);
console.log(`\nwrote ${path.relative(process.cwd(), outPath)} (${Object.keys(colors).length} colors, ${textMateRules.length} token rules)`);
