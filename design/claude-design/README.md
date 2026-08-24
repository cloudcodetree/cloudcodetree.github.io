# Claude Design sync — "Personal website redesign"

Local mirror of the design-direction artifacts from the Claude Design project
**Personal website redesign** (`09671870-de87-467e-99b9-cd7a516e6fb6`), where
the site redesign is being explored on canvas:
https://claude.ai/design/p/09671870-de87-467e-99b9-cd7a516e6fb6

## Contents

- `industry/` — the **Industry** direction: light ground, Barlow Condensed,
  steel-blue accent, square blueprint aesthetic (registration-mark corners,
  hairline borders, duotone image treatment).
- `organic/` — the **Organic** direction: warm cream ground, Caprasimo display
  type, terracotta + sage accents, pill radii, washed image treatment.

- `boards/redesign-directions-v2.dc.html` — the **v2 canvas board**: the
  Industry direction applied to the real site (front page, article, about) on
  a **dark ground** (`Turn 2 · Industry · dark ground`), with mobile behavior
  at 390pt (`Turn 3`). The dark/light token scopes it defines are extracted to
  `industry/dark-scope.css`.

Each `styles.css` is that direction's source of truth: OKLCH tonal ramps,
spacing/radius/elevation tokens, and plain-CSS component classes (buttons,
forms, cards, tags, nav, tables, dialog).

## Sync workflow

The canvas is edited at claude.ai/design; this directory is refreshed FROM it
(never hand-edited here) via the DesignSync tool in a Claude Code session —
ask Claude to "pull the design project" and it diffs `list_files` and updates
these copies. Canvas boards are mirrored under `boards/` when they carry decisions
(v2 does); they remain editable only on the canvas.

Snapshot pulled: 2026-08-22.

## Owner amendments (2026-08-24) — diverging from the canvas

Applied in code after living with the conversion; the canvas has not been
updated to match yet:

1. **The mono-color rule is repealed.** "No decorative color beyond the steel
   accent" read too monochromatic in practice. The system is now two-accent —
   steel for structure, **redline amber (#ffb24d)** for emphasis (tag pills,
   article section rules, numeric literals) — with additional hues permitted
   where they carry information (cover identities, syntax tokens).
2. **The duotone image treatment is retired.** Washing every photograph into
   the accent made the whole site read blue. Images render natural; the
   blueprint frame + corner marks remain the image treatment.
3. **Code blocks are readability-first**: GitHub-Dark-style token hues rather
   than a steel-mono scheme. Familiarity beats purity in code.
