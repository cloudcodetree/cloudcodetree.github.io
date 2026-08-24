# CloudCodeTree design system — Industry Dark, amended

The site's canonical look as built: the Industry blueprint language on a
graphite ground, evolved by three owner amendments (2026-08-24) after the
full-site conversion. This bundle IS the reference — the site's
`app/lib/industryTokens.ts` and MUI theme implement it.

## The language

Steel on graphite. Barlow Condensed headings over Barlow body, IBM Plex Mono
for the technical voice (eyebrows, metadata, code). Square corners and
hairline borders everywhere; cards, figures and code blocks are **blueprint
objects** — transparent line drawings wearing "+" registration marks
(`.blueprint` + four `<i class="corner tl/tr/bl/br">`). The grid stays
visible; whitespace beats dividers.

## Color: two accents + informational hues

- **Steel** (`--steel-*`, base `--color-accent` = steel-400 on dark) is
  STRUCTURE: chrome, links, frames, focus, primary buttons.
- **Redline amber** (`--amber-*`, `--color-emphasis`) is EMPHASIS: content
  tags, section rules, numeric literals, badges. Technical drawings have a
  markup color; this is ours.
- **Informational hues** (`--hue-green/blue/violet/coral/cyan`) are permitted
  where color carries meaning — syntax tokens, per-item cover identities,
  status. Never as pure decoration.

### The amendments (supersede the original Industry rules)

1. ~~"No decorative color beyond the steel accent"~~ — repealed. Two-accent
   system + informational hues, as above.
2. ~~Duotone photography~~ — retired. **Images render in natural color**,
   framed by the hairline + corner marks. Do not wash imagery into a hue.
3. **Code is readability-first**: GitHub-Dark-style token hues (keywords
   coral, strings light blue, builtins green, numbers amber, comments gray
   italic) inside blueprint-framed blocks. Familiarity beats palette purity.

## Rules that hold

- Square corners; hairline borders; no glass blur, no filled card surfaces.
- Registration marks on framed objects; never drop them from a `.blueprint`.
- Display type is condensed; the mono voice carries labels and data.
- Steel on graphite is chrome-grade contrast (~3:1) — for body-size text use
  steel-300 or brighter, or the ink itself.
- Focus is the 2px steel ring; selection is the steel tint. Never defaults.

## Files

- `styles.css` — the token sheet + component classes (link from every page).
- `foundations/colors.html` · `foundations/type.html` — the raw materials.
- `components/cards.html` · `components/buttons-tags.html` ·
  `components/code.html` — the working set, view-source to copy markup.
