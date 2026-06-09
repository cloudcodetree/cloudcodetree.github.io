'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Skeleton, Pagination } from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost, SERIF, MONO, ACCENT, LINK, formatLongDate, markdownSx } from './blogShared';

const POSTS_PER_PAGE = 10;

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Restore page position when returning from an article (?page=N).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('page');
    const n = p ? parseInt(p, 10) : 1;
    if (n > 1) setPage(n);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const index: BlogPost[] = await (await fetch('/blog/posts.json')).json();
        const withContent = await Promise.all(
          index.map(async (post) => {
            try {
              const r = await fetch(`/blog/${post.filename}`);
              return { ...post, content: r.ok ? await r.text() : '' };
            } catch {
              return { ...post, content: '' };
            }
          })
        );
        setPosts(withContent);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pagePosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const goToPage = (n: number) => {
    setPage(n);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', n === 1 ? '/blog/' : `/blog/?page=${n}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      {/* Masthead */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: { xs: 5, md: 7 } }}
      >
        <Typography
          sx={{
            fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5,
          }}
        >
          CloudCodeTree&nbsp;·&nbsp;Journal
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' },
            lineHeight: 0.95, letterSpacing: '-0.02em', m: 0,
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          AI News
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 560 }}>
            Daily field notes on AI-assisted engineering.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ py: 5, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
              <Skeleton variant="text" width={150} height={16} />
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="95%" height={18} />
              <Skeleton variant="text" width="90%" height={18} />
              <Skeleton variant="text" width="80%" height={18} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box>
          {pagePosts.map((post, index) => (
            <Box
              key={post.id}
              component={motion.div}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
              sx={{ py: { xs: 4, md: 6 }, borderTop: '1px solid rgba(148,163,184,0.12)' }}
            >
              {/* Featured image — links to the article */}
              {post.image && (
                <Box component={Link} href={`/blog/${post.id}/`} sx={{ display: 'block', mb: 2.5 }}>
                  <Box
                    component="img"
                    src={post.image}
                    alt=""
                    loading="lazy"
                    sx={{
                      width: '100%', aspectRatio: '1200 / 630', objectFit: 'cover', display: 'block',
                      borderRadius: 2, border: '1px solid rgba(148,163,184,0.12)',
                    }}
                  />
                </Box>
              )}

              {/* Meta line */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', letterSpacing: '0.04em' }}>
                  {formatLongDate(post.date)} · {post.readTime} min read
                </Typography>
              </Box>

              {/* Title — links to the article */}
              <Typography
                component={Link}
                href={`/blog/${post.id}/`}
                sx={{
                  display: 'block', fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.7rem', md: '2.2rem' },
                  lineHeight: 1.12, letterSpacing: '-0.015em', mb: 2.5, color: 'text.primary', textDecoration: 'none',
                  transition: 'color 0.22s ease', '&:hover': { color: LINK },
                }}
              >
                {post.title}
              </Typography>

              {/* Full entry content */}
              <Box sx={markdownSx}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
              </Box>
            </Box>
          ))}
          {pagePosts.length > 0 && <Box sx={{ borderTop: '1px solid rgba(148,163,184,0.12)' }} />}

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={(_, value) => goToPage(value)}
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': { fontFamily: MONO, color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)' },
                  '& .Mui-selected': { background: `${ACCENT} !important`, color: '#0d1117', borderColor: ACCENT },
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {posts.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>// no posts yet</Typography>
        </Box>
      )}
    </Container>
  );
}
