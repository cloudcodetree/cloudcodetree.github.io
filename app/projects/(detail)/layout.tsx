'use client';

import { Container, Box, Button } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SERIF, LINK } from '../../components/blogShared';
import LaunchDemoButton from '../../components/demo/LaunchDemoButton';
import AccountMenu from '../../components/demo/AccountMenu';
import { projects } from '../manifest';

// Styles raw MDX elements for project write-ups. Mirrors the tutorials
// (article) layout; the author writes the H1 in the MDX.
const projectSx = {
  lineHeight: 1.8,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  '& h1': { fontFamily: SERIF, fontSize: { xs: '1.9rem', md: '2.6rem' }, fontWeight: 600, lineHeight: 1.12, mb: 2 },
  '& h2': { fontFamily: SERIF, fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 600, mt: 5, mb: 1.5 },
  '& h3': { fontSize: { xs: '1.1rem', md: '1.2rem' }, fontWeight: 600, mt: 3, mb: 1 },
  '& p': { mb: 2, lineHeight: 1.8 },
  '& strong': { color: '#ffffff', fontWeight: 700 },
  '& a': { color: LINK, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
  '& ul, & ol': { mb: 2, pl: 3 },
  '& li': { mb: 1, lineHeight: 1.8 },
  '& blockquote': { m: '28px 0', p: '16px 20px', backgroundColor: '#161b22', border: '1px solid #222a35', borderLeft: `3px solid ${LINK}`, borderRadius: 2, color: 'text.secondary', '& p': { m: 0 } },
  '& hr': { border: 0, borderTop: '1px solid #222a35', my: 4 },
  '& pre': { backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 1, p: 2, maxWidth: '100%', overflowX: 'auto', mb: 2, fontSize: { xs: '0.78rem', md: '0.875rem' }, '& code': { whiteSpace: 'pre', overflowWrap: 'normal', wordBreak: 'normal', background: 'none', p: 0 } },
  '& code': { backgroundColor: 'rgba(30,41,59,0.6)', px: 0.75, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.9em' },
  '& table': { display: 'block', maxWidth: '100%', overflowX: 'auto', borderCollapse: 'collapse', mb: 2, '& th, & td': { border: '1px solid #222a35', p: 1, textAlign: 'left' } },
} as const;

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  // /projects/<slug>/ — the launch button (and the ?signin=1&next= handler it
  // carries) mounts on every detail page whose manifest entry has a demo.
  const pathname = usePathname();
  const slug = pathname.split('/').filter(Boolean)[1];
  const project = projects.find((p) => p.slug === slug);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button component={Link} href="/projects/" sx={{ m: 0 }}>← Back to Projects</Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {project?.demo?.status === 'live' && <LaunchDemoButton slug={project.slug} title={project.title} />}
          <AccountMenu />
        </Box>
      </Box>
      <Box sx={projectSx}>{children}</Box>
    </Container>
  );
}
