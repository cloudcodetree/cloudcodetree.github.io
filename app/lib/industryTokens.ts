// Industry design system — dark-ground tokens.
// Source of truth: design/claude-design/industry/styles.css + dark-scope.css
// (synced from the "Personal website redesign" Claude Design canvas).
// Per the system's readme: never hard-code a hex these tokens carry.

export const industry = {
  ground: '#1d1f20',
  surface: '#2b2b2d',
  ink: '#f2f2f3',
  inkSecondary: '#b7b7ba', // neutral-400
  divider: 'rgba(242,242,243,0.2)',

  // Steel accent ramp (OKLCH-derived, shared lightness scale)
  accent: {
    100: '#eef6ff', 200: '#d6ebff', 300: '#b5d9fd', 400: '#94bce3',
    500: '#749dc4', 600: '#597ea3', 700: '#416180', 800: '#2c455d', 900: '#1d2d3d',
  },

  /** Label/link color on the dark ground (accent-400 per the v2 board). */
  label: '#94bce3',
  linkHover: '#b5d9fd',

  // Redline amber — the drawing's markup color. Owner amendment 2026-08-24:
  // the original "no color beyond the steel accent" rule read too
  // monochromatic in practice. Amber carries EMPHASIS (tags, section rules,
  // string literals, badges); steel keeps STRUCTURE (chrome, links, frames).
  amber: {
    300: '#ffd9a3', 400: '#ffb24d', 500: '#e89a35', 600: '#c47f24',
  },

  radius: { sm: 2, md: 4, lg: 7 },
} as const;
