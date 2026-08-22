# Industry-on-Dark Conversion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the whole site from dark-glass (blue/cyan/green, Fraunces, rounded, blur) to the **Industry direction on its dark ground** as established by the v2 canvas board — token-first, staging-verified, production untouched until merge + cutover.

**Source of truth:** `design/claude-design/industry/styles.css` + `industry/dark-scope.css` + `boards/redesign-directions-v2.dc.html` (+ `industry/readme.md` do/don'ts).

**Spec basis:** rollout decision "whole site, token-first" (user, 2026-08-22).

## Token mapping (old → new)

| Role | Old | New (Industry dark) |
|---|---|---|
| Ground | `#0d1117` | `#1d1f20` (`--color-bg` dark scope) |
| Surface | `#161b22`, `rgba(30,41,59,.7)` glass | `#2b2b2d`, flat + hairline |
| Accent (labels/chips) | `#3fb950` green | `#94bce3` (accent-400 on dark) |
| Accent rgba | `rgba(63,185,80,x)` | `rgba(148,188,227,x)` |
| Link | `#2f81f7` | `#94bce3` (hover `#b5d9fd`) |
| Primary | `#3b82f6` | `#749dc4` (accent-500) |
| Secondary | `#06b6d4` | `#94bce3` |
| Display font | Fraunces | **Barlow Condensed** (`--font-display`) |
| Body font | Inter | **Barlow** |
| Mono | IBM Plex Mono | keep (technical labels fit the language) |
| Radius | 8–12px, sx multiples | theme shape 1px → sx multiples ≤ 3px; key surfaces square |
| Blur/glass | backdrop-filter everywhere | none — hairline borders (`1px solid` divider) |

### Task A — Foundations (everything reads these)
`app/layout.tsx` fonts (next/font: Barlow, Barlow_Condensed, keep Plex Mono; var `--font-display` replaces `--font-fraunces` and `--font-inter`→`--font-body`); `app/lib/theme.ts` (palette, typography, shape=1, component overrides drop blur/glass for hairlines); `app/components/blogShared.ts` (SERIF→display var, ACCENT, LINK); `app/globals.css` grounds; then the mechanical sweep of the mapping table across `app/**` (tsx/ts/css/mdx). Build, deploy staging, before/after screenshots of front page, article, tutorials, projects, about. Lint+tests green.

### Task B — Blueprint grammar
`Blueprint` React component (hairline frame + 4 registration-mark corners per readme markup); apply to blog/tutorial/project cards and featured figures; `.duotone` treatment for content imagery (blog post images); nav restyle per board (square, hairline bottom rule… board shows borderless nav — follow board); focus-visible ring to accent.

### Task C — Page fidelity to the v2 board
Front page masthead ("field notes" sub, spec-plate numbers treatment), article page (code block styling per board, meta rows), about page layout. Mobile at 390pt: single column, plate 2×2, type steps down one.

### Task D — Generated assets + verification
Regenerate tutorial + project covers in Industry palette (generators take colors); OG images inherit covers; Lighthouse (a11y ≥ 100 held — note readme's 3:1 warning: accent-on-ground is chrome-grade, use `--color-accent-300`/lighter or larger sizes for text); parity contract; frontend-reviewer agent pass; evidence file.

**Rule from the readme:** never hard-code a hex the tokens carry — Task A introduces the tokens as the single source (`app/lib/industryTokens.ts` exporting the ramp so future components import, not paste).
