// Shared types and styling for the AI News blog (list + article views).

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  date: string;
  tags: string[];
  readTime: number;
  filename?: string;
  eyebrow?: string;
  dek?: string;
}

export const SERIF = 'var(--font-fraunces), Georgia, serif';
export const MONO = 'var(--font-plex-mono), ui-monospace, monospace';
export const ACCENT = '#3fb950';
export const LINK = '#2f81f7';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "06-04-2026" → "Jun 4, 2026" */
export function formatLongDate(d: string): string {
  const [mm, dd, yyyy] = d.split('-').map(Number);
  if (!mm || !dd || !yyyy) return d;
  return `${MONTHS[mm - 1]} ${dd}, ${yyyy}`;
}

/** Markdown rendering style shared by the feed and the article page. */
export const markdownSx = {
  lineHeight: 1.8,
  // Title is rendered separately; hide a duplicate leading H1 in the body.
  '& h1:first-of-type': { display: 'none' },
  '& h1': { fontSize: '2rem', fontWeight: 600, mb: 2 },
  '& h2': { fontSize: '1.3rem', fontWeight: 600, mt: 4, mb: 1.5, pl: 1.5, borderLeft: `3px solid ${ACCENT}` },
  '& h3': { fontSize: '1.15rem', fontWeight: 600, mt: 3, mb: 1 },
  '& p': { mb: 2, lineHeight: 1.8 },
  '& strong': { color: '#ffffff', fontWeight: 700 },
  '& a': { color: LINK, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& blockquote': {
    m: '28px 0', p: '16px 20px', backgroundColor: '#161b22', border: '1px solid #222a35',
    borderLeft: `3px solid ${LINK}`, borderRadius: 2, color: 'text.secondary', fontSize: '0.97rem',
    '& p': { m: 0 }, '& strong': { color: 'text.primary' },
  },
  '& hr': { border: 0, borderTop: '1px solid #222a35', my: 3 },
  '& hr + p': { color: 'text.secondary', fontSize: 13 },
  '& pre': { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 1, p: 2, overflow: 'auto', mb: 2 },
  '& code': { backgroundColor: 'rgba(30, 41, 59, 0.6)', px: 1, py: 0.5, borderRadius: 0.5, fontFamily: 'monospace' },
  '& ul, & ol': { mb: 2, pl: 3 },
  '& li': { mb: 1, lineHeight: 1.8 },
} as const;
