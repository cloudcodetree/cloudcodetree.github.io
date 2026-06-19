'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Typography, Box, Skeleton, Pagination,
  ToggleButtonGroup, ToggleButton, Grid, Chip,
  Select, MenuItem,
} from '@mui/material';
import { GridView, ViewList, ViewStream } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost, SERIF, MONO, ACCENT, LINK, formatPublished, markdownSx, markdownComponents } from './blogShared';

interface BlogPageProps {
  /** Slim (content-free) index of every post, newest-first, embedded at build time. */
  posts: BlogPost[];
}

type View = 'list' | 'cards' | 'feed';
const VIEWS: View[] = ['list', 'cards', 'feed'];
const PAGE_DEFAULT: Record<View, number> = { list: 40, cards: 20, feed: 5 };
const PAGE_OPTIONS = [5, 10, 20, 40, 50];
const border = '1px solid rgba(148,163,184,0.12)';

const clamp = (n: number) => ({
  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: n,
  overflow: 'hidden', textOverflow: 'ellipsis',
} as const);

const topicTags = (post: BlogPost) => post.tags.filter((t) => t.toLowerCase() !== 'ai');

/** Shared tag-pill row, identical across every view. */
function Pills({ post, max = 3 }: { post: BlogPost; max?: number }) {
  const tags = topicTags(post).slice(0, max);
  if (!tags.length) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {tags.map((t) => (
        <Chip key={t} label={t} size="small"
          sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(63,185,80,0.1)', color: ACCENT, border: '1px solid rgba(63,185,80,0.25)' }} />
      ))}
    </Box>
  );
}

export default function BlogPage({ posts }: BlogPageProps) {
  const [view, setView] = useState<View>('cards');              // SSR default
  const [sizeOverride, setSizeOverride] = useState<Partial<Record<View, number>>>({});
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Feed bodies are loaded lazily (only when the feed view is opened).
  const [feedContent, setFeedContent] = useState<Map<string, string> | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedRef = useRef<Map<string, string> | null>(null);

  // Topic chips: every tag except the ubiquitous "AI", most-used first, with counts.
  const topics = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of posts) for (const t of p.tags || []) if (t.toLowerCase() !== 'ai') c[t] = (c[t] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  // Filter (OR): a post matches if it carries any selected topic.
  const filteredPosts = useMemo(
    () => (selectedTags.length ? posts.filter((p) => p.tags.some((t) => selectedTags.includes(t))) : posts),
    [posts, selectedTags],
  );

  const pageSize = sizeOverride[view] ?? PAGE_DEFAULT[view];
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagePosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reconcile view + page-size prefs from localStorage and ?page/?topics from the URL.
  useEffect(() => {
    const v = window.localStorage.getItem('ainews-view') as View | null;
    if (v && VIEWS.includes(v)) setView(v);
    try {
      const s = JSON.parse(window.localStorage.getItem('ainews-pagesize') || '{}');
      if (s && typeof s === 'object') setSizeOverride(s);
    } catch { /* ignore */ }
    const params = new URLSearchParams(window.location.search);
    const t = params.get('topics');
    if (t) setSelectedTags(t.split(',').map((s) => s.trim()).filter(Boolean));
    const n = parseInt(params.get('page') || '1', 10);
    if (n > 1) setPage(n);
  }, []);

  // Keep the URL (?page, ?topics) in sync, clamped, on the CURRENT path (/ or /ai-news/).
  useEffect(() => {
    if (page !== safePage) { setPage(safePage); return; }
    const params = new URLSearchParams();
    if (selectedTags.length) params.set('topics', selectedTags.join(','));
    if (safePage > 1) params.set('page', String(safePage));
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, view, pageSize, selectedTags]);

  // Lazy-load full bodies the first time the feed view is opened.
  useEffect(() => {
    if (view !== 'feed' || feedRef.current) return;
    setFeedLoading(true);
    fetch('/blog/posts.json')
      .then((r) => r.json())
      .then((all: BlogPost[]) => {
        const m = new Map(all.map((p) => [p.id, p.content || '']));
        feedRef.current = m;
        setFeedContent(m);
      })
      .catch(() => { /* leave bodies empty on failure */ })
      .finally(() => setFeedLoading(false));
  }, [view]);

  const chooseView = (v: View | null) => {
    if (!v) return;
    setView(v);
    window.localStorage.setItem('ainews-view', v);
  };

  const choosePageSize = (n: number) => {
    const next = { ...sizeOverride, [view]: n };
    setSizeOverride(next);
    setPage(1);
    window.localStorage.setItem('ainews-pagesize', JSON.stringify(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setPage(1);
  };
  const clearTags = () => { setSelectedTags([]); setPage(1); };

  const metaLine = (post: BlogPost) => `${formatPublished(post)} · ${post.readTime} min read`;

  // ---- per-view renderers --------------------------------------------------

  const listView = (
    <Box>
      {pagePosts.map((post, i) => (
        <Box
          key={post.id}
          component={motion.div}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25) }}
          sx={{ display: 'flex', gap: 2.5, py: 3, borderTop: border, alignItems: 'flex-start' }}
        >
          {post.image && (
            <Box component={Link} href={`/ai-news/${post.id}/`} sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
              <Box component="img" src={post.image} alt={post.title} loading="lazy"
                sx={{ width: 132, aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', borderRadius: 1.5, border }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em' }}>
              {metaLine(post)}
            </Typography>
            <Typography component={Link} href={`/ai-news/${post.id}/`}
              sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.15, color: 'text.primary', textDecoration: 'none', ...clamp(2), transition: 'color .2s ease', '&:hover': { color: LINK } }}>
              {post.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5, ...clamp(2) }}>
              {post.excerpt}
            </Typography>
            <Pills post={post} />
          </Box>
        </Box>
      ))}
      <Box sx={{ borderTop: border }} />
    </Box>
  );

  const cardsView = (
    <Grid container spacing={3}>
      {pagePosts.map((post, i) => (
        <Grid size={{ xs: 12, sm: 6 }} key={post.id}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
            sx={{
              height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border, overflow: 'hidden',
              background: 'rgba(148,163,184,0.03)', transition: 'border-color .2s ease, transform .2s ease',
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
                sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.2, color: 'text.primary', textDecoration: 'none', ...clamp(3), transition: 'color .2s ease', '&:hover': { color: LINK } }}>
                {post.title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.5, ...clamp(3) }}>
                {post.excerpt}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 0.5 }}><Pills post={post} /></Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const feedView = (
    <Box>
      {pagePosts.map((post, i) => {
        const body = feedContent?.get(post.id);
        return (
          <Box
            key={post.id}
            component={motion.div}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
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
              sx={{ display: 'block', fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.7rem', md: '2.2rem' }, lineHeight: 1.12, letterSpacing: '-0.015em', mb: 1.5, color: 'text.primary', textDecoration: 'none', transition: 'color 0.22s ease', '&:hover': { color: LINK } }}>
              {post.title}
            </Typography>
            <Box sx={{ mb: 2.5 }}><Pills post={post} /></Box>
            {body !== undefined ? (
              <Box sx={markdownSx}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body}</ReactMarkdown>
              </Box>
            ) : (
              <Box>
                <Skeleton variant="text" width="95%" /><Skeleton variant="text" width="92%" /><Skeleton variant="text" width="60%" />
              </Box>
            )}
          </Box>
        );
      })}
      <Box sx={{ borderTop: border }} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      {/* Masthead */}
      <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography sx={{ fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5 }}>
          CloudCodeTree&nbsp;·&nbsp;Journal
        </Typography>
        <Typography component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' }, lineHeight: 0.95, letterSpacing: '-0.02em', m: 0, background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI News
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 560 }}>
            Daily field notes on AI-assisted engineering.
          </Typography>
        </Box>
      </Box>

      {/* Controls: view switcher + page size */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>Per page</Typography>
          <Select value={pageSize} onChange={(e) => choosePageSize(Number(e.target.value))} size="small"
            sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' }, '.MuiSvgIcon-root': { color: 'text.secondary' } }}>
            {PAGE_OPTIONS.map((n) => <MenuItem key={n} value={n} sx={{ fontFamily: MONO, fontSize: 12 }}>{n}</MenuItem>)}
          </Select>
        </Box>
        <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, v) => chooseView(v)} aria-label="Choose layout"
          sx={{ '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)', px: 1.25 }, '& .Mui-selected': { color: `${ACCENT} !important`, background: 'rgba(63,185,80,0.12) !important' } }}>
          <ToggleButton value="list" aria-label="Compact list"><ViewList fontSize="small" /></ToggleButton>
          <ToggleButton value="cards" aria-label="Cards"><GridView fontSize="small" /></ToggleButton>
          <ToggleButton value="feed" aria-label="Full feed"><ViewStream fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Topic filter */}
      {topics.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', mr: 0.5 }}>Topics</Typography>
          {topics.map(({ tag, count }) => {
            const on = selectedTags.includes(tag);
            return (
              <Chip
                key={tag}
                label={`${tag} ${count}`}
                size="small"
                onClick={() => toggleTag(tag)}
                sx={{
                  fontFamily: MONO, fontSize: 11, cursor: 'pointer',
                  color: on ? '#0d1117' : 'text.secondary',
                  background: on ? ACCENT : 'transparent',
                  border: '1px solid', borderColor: on ? ACCENT : 'rgba(148,163,184,0.25)',
                  '& .MuiChip-label': { px: 1 },
                  '&:hover': { background: on ? ACCENT : 'rgba(63,185,80,0.12)' },
                }}
              />
            );
          })}
          {selectedTags.length > 0 && (
            <Chip
              label={`Clear · ${filteredPosts.length} post${filteredPosts.length === 1 ? '' : 's'}`}
              size="small"
              onClick={clearTags}
              sx={{ fontFamily: MONO, fontSize: 11, cursor: 'pointer', color: ACCENT, background: 'transparent', border: '1px solid', borderColor: ACCENT, '& .MuiChip-label': { px: 1 } }}
            />
          )}
        </Box>
      )}

      {filteredPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>
            {posts.length === 0 ? '// no posts yet' : '// no posts match those topics — clear a filter above'}
          </Typography>
        </Box>
      ) : (
        <>
          {view === 'list' ? listView : view === 'cards' ? cardsView : feedView}

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination count={pageCount} page={safePage} onChange={(_, v) => goToPage(v)} shape="rounded"
                sx={{ '& .MuiPaginationItem-root': { fontFamily: MONO, color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)' }, '& .Mui-selected': { background: `${ACCENT} !important`, color: '#0d1117', borderColor: ACCENT } }} />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
