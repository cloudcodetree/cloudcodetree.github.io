'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Chip, Button } from '@mui/material';
import { AccessTime as TimeIcon, Person as PersonIcon } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost as Post, SERIF, MONO, formatLongDate, markdownSx } from './blogShared';

export default function BlogPost({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const index: Post[] = await (await fetch('/blog/posts.json')).json();
        const meta = index.find((p) => p.id === id);
        if (!meta) { setPost(null); return; }
        const content = meta.filename ? await (await fetch(`/blog/${meta.filename}`)).text() : '';
        setPost({ ...meta, content });
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const backButton = (
    <Button component={Link} href="/ai-news/" sx={{ mb: 4 }}>
      ← Back to AI News
    </Button>
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        {backButton}
        <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>Loading…</Typography>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        {backButton}
        <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>
          // article not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        {backButton}

        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt=""
            sx={{
              width: '100%', aspectRatio: '1200 / 630', objectFit: 'cover', display: 'block',
              borderRadius: 2, border: '1px solid #222a35', mb: 3,
            }}
          />
        )}

        <Typography
          component="h1"
          sx={{
            fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '2.1rem', md: '3rem' },
            lineHeight: 1.08, letterSpacing: '-0.015em', mb: 2,
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
          <Typography variant="body2">{formatLongDate(post.date)}</Typography>
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
          <CardContent sx={{ p: 4 }}>
            <Box sx={markdownSx}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
