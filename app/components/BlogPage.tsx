'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Skeleton, Pagination,
  ToggleButtonGroup, ToggleButton, Grid, Chip,
} from '@mui/material';
import { GridView, ViewList, ViewStream } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost, BlogPageChunk, SERIF, MONO, ACCENT, LINK, formatPublished, markdownSx, markdownComponents } from './blogShared';

interface BlogPageProps {
  /** Page 1, embedded in the static HTML at build time. */
  initialPosts: BlogPost[];
  pageCount: number;
}

type View = 'cards' | 'list' | 'feed';
const VIEWS: View[] = ['cards', 'list', 'feed'];
const border = '1px solid rgba(148,163,184,0.12)';

/** Clamp text to N lines. */
const clamp = (n: number) => ({
  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: n,
  overflow: 'hidden', textOverflow: 'ellipsis',
} as const);

/** Non-AI tags, most-specific first, for compact chip rows. */
const topicTags = (post: BlogPost) => post.tags.filter((t) => t.toLowerCase() !== 'ai');

export default function BlogPage({ initialPosts, pageCount }: BlogPageProps) {
  const [page, setPage] = useState(1);
  const [pagePosts, setPagePosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('cards'); // SSR default; reconciled from localStorage after mount
  const cache = useRef<Map<number, BlogPost[]>>(new Map([[1, initialPosts]]));

  // Restore the reader's preferred view (client-only — keeps SSR markup = 'cards').
  useEffect(() => {
    const saved = window.localStorage.getItem('ainews-view') as View | null;
    if (saved && VIEWS.includes(saved)) setView(saved);
  }, []);

  const chooseView = (v: View | null) => {
    if (!v) return;
    setView(v);
    window.localStorage.setItem('ainews-view', v);
  };

  // Restore page position when returning from an article (?page=N).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('page');
    const n = p ? parseInt(p, 10) : 1;
    if (n > 1 && n <= pageCount) goToPage(n, { replaceUrl: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = async (n: number, { replaceUrl = true } = {}) => {
    setPage(n);
    if (replaceUrl) {
      window.history.replaceState(null, '', n === 1 ? '/ai-news/' : `/ai-news/?page=${n}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const cached = cache.current.get(n);
    if (cached) { setPagePosts(cached); return; }
    try {
      setLoading(true);
      const chunk: BlogPageChunk = await (await fetch(`/blog/pages/${n}.json`)).json();
      cache.current.set(n, chunk.posts);
      setPagePosts(chunk.posts);
    } catch {
      setPagePosts([]);
    } finally {
      setLoading(false);
    }
  };

  const metaLine = (post: BlogPost) => `${formatPublished(post)} · ${post.readTime} min read`;

  // ---- per-view post renderers --------------------------------------------

  const cardsView = (
    <Grid container spacing={3}>
      {pagePosts.map((post, index) => (
        <Grid size={{ xs: 12, sm: 6 }} key={post.id}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
            sx={{
              height: '100%', display: 'flex', flexDirection: 'column',
              borderRadius: 2, border, overflow: 'hidden',
              background: 'rgba(148,163,184,0.03)',
              transition: 'border-color .2s ease, transform .2s ease',
              '&:hover': { borderColor: 'rgba(63,185,80,0.4)', transform: 'translateY(-2px)' },
            }}
          >
            {post.image && (
              <Box component={Link} href={`/ai-news/${post.id}/`} sx={{ display: 'block' }}>
                <Box component="img" src={post.image} alt={post.title} loading="lazy"
                  sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, flexGrow: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em' }}>
                {metaLine(post)}
              </Typography>
              <Typography component={Link} href={`/ai-news/${post.id}/`}
                sx={{
                  fontFamily: SERIF, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.2,
                  color: 'text.primary', textDecoration: 'none', ...clamp(3),
                  transition: 'color .2s ease', '&:hover': { color: LINK },
                }}>
                {post.title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.5, ...clamp(3) }}>
                {post.excerpt}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 'auto', pt: 0.5 }}>
                {topicTags(post).slice(0, 3).map((t) => (
                  <Chip key={t} label={t} size="small"
                    sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(63,185,80,0.1)', color: ACCENT, border: '1px solid rgba(63,185,80,0.25)' }} />
                ))}
              </Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const listView = (
    <Box>
      {pagePosts.map((post, index) => (
        <Box
          key={post.id}
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
          sx={{ display: 'flex', gap: 2.5, py: 3, borderTop: border, alignItems: 'flex-start' }}
        >
          {post.image && (
            <Box component={Link} href={`/ai-news/${post.id}/`}
              sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
              <Box component="img" src={post.image} alt={post.title} loading="lazy"
                sx={{ width: 132, aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', borderRadius: 1.5, border }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em', mb: 0.75 }}>
              {topicTags(post)[0] ? `${topicTags(post)[0]} · ` : ''}{metaLine(post)}
            </Typography>
            <Typography component={Link} href={`/ai-news/${post.id}/`}
              sx={{
                fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' },
                lineHeight: 1.15, color: 'text.primary', textDecoration: 'none', mb: 0.75, ...clamp(2),
                transition: 'color .2s ease', '&:hover': { color: LINK },
              }}>
              {post.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5, ...clamp(2) }}>
              {post.excerpt}
            </Typography>
          </Box>
        </Box>
      ))}
      <Box sx={{ borderTop: border }} />
    </Box>
  );

  const feedView = (
    <Box>
      {pagePosts.map((post, index) => (
        <Box
          key={post.id}
          component={motion.div}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
          sx={{ py: { xs: 4, md: 6 }, borderTop: border }}
        >
          {post.image && (
            <Box component={Link} href={`/ai-news/${post.id}/`} sx={{ display: 'block', mb: 2.5 }}>
              <Box component="img" src={post.image} alt={post.title} loading="lazy"
                sx={{ width: '100%', maxHeight: 320, aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', borderRadius: 2, border }} />
            </Box>
          )}
          <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', letterSpacing: '0.04em', mb: 1.5 }}>
            {metaLine(post)}
          </Typography>
          <Typography component={Link} href={`/ai-news/${post.id}/`}
            sx={{
              display: 'block', fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.7rem', md: '2.2rem' },
              lineHeight: 1.12, letterSpacing: '-0.015em', mb: 2.5, color: 'text.primary', textDecoration: 'none',
              transition: 'color 0.22s ease', '&:hover': { color: LINK },
            }}>
            {post.title}
          </Typography>
          <Box sx={markdownSx}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{post.content || ''}</ReactMarkdown>
          </Box>
        </Box>
      ))}
      {pagePosts.length > 0 && <Box sx={{ borderTop: border }} />}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      {/* Masthead */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: { xs: 4, md: 6 } }}
      >
        <Typography sx={{ fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5 }}>
          CloudCodeTree&nbsp;·&nbsp;Journal
        </Typography>
        <Typography component="h1"
          sx={{
            fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' },
            lineHeight: 0.95, letterSpacing: '-0.02em', m: 0,
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
          AI News
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 560 }}>
            Daily field notes on AI-assisted engineering.
          </Typography>
        </Box>
      </Box>

      {/* View switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 2, md: 3 } }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, v) => chooseView(v)}
          aria-label="Choose layout"
          sx={{
            '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)', px: 1.25 },
            '& .Mui-selected': { color: `${ACCENT} !important`, background: 'rgba(63,185,80,0.12) !important' },
          }}
        >
          <ToggleButton value="cards" aria-label="Cards"><GridView fontSize="small" /></ToggleButton>
          <ToggleButton value="list" aria-label="Compact list"><ViewList fontSize="small" /></ToggleButton>
          <ToggleButton value="feed" aria-label="Full feed"><ViewStream fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ py: 4, borderTop: border }}>
              <Skeleton variant="text" width={150} height={16} />
              <Skeleton variant="text" width="60%" height={36} />
              <Skeleton variant="text" width="95%" height={18} />
              <Skeleton variant="text" width="85%" height={18} />
            </Box>
          ))}
        </Box>
      ) : pagePosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>{'// no posts yet'}</Typography>
        </Box>
      ) : (
        <>
          {view === 'cards' ? cardsView : view === 'list' ? listView : feedView}

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) => goToPage(value)}
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': { fontFamily: MONO, color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)' },
                  '& .Mui-selected': { background: `${ACCENT} !important`, color: '#0d1117', borderColor: ACCENT },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
