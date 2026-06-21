'use client';

import { Container, Typography, Box, Card, CardContent, Chip, Button } from '@mui/material';
import { AccessTime as TimeIcon, Person as PersonIcon } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost as Post, SERIF, MONO, formatPublished, markdownSx, markdownComponents } from './blogShared';

// The post is loaded at build time by app/ai-news/[id]/page.tsx and baked into
// the static HTML — no client-side fetch, no loading state.
export default function BlogPost({ post }: { post: Post }) {
  const backButton = (
    <Button component={Link} href="/ai-news/" sx={{ mb: 4 }}>
      ← Back to AI News
    </Button>
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        {backButton}

        {post.image && (
          <Box sx={{ mb: 3 }}>
            <Box
              component="img"
              src={post.image}
              alt={post.title}
              sx={{
                width: '100%', aspectRatio: '1200 / 630', objectFit: 'cover', display: 'block',
                borderRadius: 2, border: '1px solid #222a35',
              }}
            />
            {post.imageCredit && (
              <Typography sx={{ mt: 0.75, fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
                Photo:{' '}
                <Box component="a" href={post.imageCreditUrl || 'https://www.pexels.com'} target="_blank" rel="noopener noreferrer" sx={{ color: 'inherit', textDecoration: 'underline' }}>
                  {post.imageCredit}
                </Box>
                {' / '}
                <Box component="a" href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" sx={{ color: 'inherit', textDecoration: 'underline' }}>
                  Pexels
                </Box>
              </Typography>
            )}
          </Box>
        )}

        <Typography
          component="h1"
          sx={{
            fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.6rem', sm: '2.1rem', md: '3rem' },
            lineHeight: 1.12, letterSpacing: '-0.015em', mb: 2, overflowWrap: 'anywhere',
          }}
        >
          {post.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: post.dek ? 2 : 4, color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2">{post.author}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon fontSize="small" />
            <Typography variant="body2">{post.readTime} min read</Typography>
          </Box>
          <Typography variant="body2">{formatPublished(post)}</Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          {post.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ mr: 1, mb: 1, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
            />
          ))}
        </Box>

        {post.dek && (
          <Typography sx={{ color: 'text.secondary', fontSize: '1.12rem', lineHeight: 1.6, mb: 4, pb: 3, borderBottom: '1px solid #222a35' }}>
            {post.dek}
          </Typography>
        )}

        <Card className="glass">
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={markdownSx}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{post.content || ''}</ReactMarkdown>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
