'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Typography, Box, Button, Alert, Pagination,
  ToggleButtonGroup, ToggleButton, Grid, Chip,
  Select, MenuItem,
} from '@mui/material';
import {
  GridView, ViewList, ViewStream, RssFeed, ContentCopy, Check,
  VisibilityOff, Bookmark, BookmarkBorder,
} from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FeedBody from './FeedBody';
import { usePostArchive, type PostArchive } from '../lib/usePostArchive';
import { BlogPost, SERIF, MONO, ACCENT, LINK, formatPublished, markdownSx } from './blogShared';
import { Corners } from './Blueprint';
import SearchBox from './SearchBox';
import ReaderStateNotice from './ReaderStateNotice';
import TopicsFlyout from './TopicsFlyout';
import {
  applyReaderState, loadReaderState, selectVisiblePosts, setSaved, watchReaderAuth,
  type ReaderRow, type ReaderStateMap, type WithReaderState,
} from '../lib/readerState';
// eslint-disable-next-line import/no-relative-packages
import { topicTags } from '../../scripts/lib/topics.mjs';

interface BlogPageProps {
  /** First-page metadata (or an already-filtered result set), newest-first. */
  posts: BlogPost[];
  archive?: PostArchive;
  heading?: string;
  /**
   * A function is called with the number of posts actually on screen after
   * every filter. /saved needs that: unsaving a card removes it here, inside
   * this component, so a caller-computed count would immediately be a lie.
   */
  intro?: React.ReactNode | ((visibleCount: number) => React.ReactNode);
  feedPath?: string;
  emptyMessage?: string;
  /**
   * Set by the topic landing route. The posts arriving here are ALREADY
   * prefiltered to this tag, so it is deliberately not preselected in the
   * flyout — the flyout narrows within the topic instead of re-applying it.
   */
  topic?: { tag: string; slug: string };
  showSearch?: boolean;
  /**
   * /saved. Narrows the list to posts this reader has saved, live: unsaving a
   * card here drops it from the list without a reload. Signed out it is inert —
   * no reader state is ever loaded, so nothing is saved and the list is empty.
   */
  onlySaved?: boolean;
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

const postTopics = (post: BlogPost) => post.tags.filter((t) => t.toLowerCase() !== 'ai');

/** The signed-out reader's state: no rows, ever. One shared, never-mutated Map. */
const EMPTY_STATE: ReaderStateMap = new Map();

/**
 * Shared tag-pill row, identical across every view.
 *
 * `extra` carries the signed-in reader-state controls. It is undefined for a
 * signed-out reader, so the row renders exactly the markup it always has.
 */
function Pills({ post, max = 3, extra }: { post: BlogPost; max?: number; extra?: React.ReactNode }) {
  const tags = postTopics(post).slice(0, max);
  if (!tags.length && !extra) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {tags.map((t) => (
        <Chip key={t} label={t} size="small"
          sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(255,178,77,0.08)', color: '#ffb24d', border: '1px solid rgba(255,178,77,0.3)' }} />
      ))}
      {extra}
    </Box>
  );
}

/** Post as the list sees it once this reader's state is merged in. */
type ReaderPost = WithReaderState<BlogPost>;

/** "Read" marker — same geometry as a tag pill, in the accent rather than amber. */
function ReadChip() {
  return (
    <Chip label="Read" size="small"
      sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(148,188,227,0.08)', color: ACCENT, border: `1px solid rgba(148,188,227,0.3)` }} />
  );
}

/** Save / unsave, sitting in the pill row. Optimistic; reverts if the write fails. */
function SaveChip({ post, onToggle, busy }: { post: ReaderPost; onToggle: (post: ReaderPost) => void; busy: boolean }) {
  return (
    <Chip
      size="small"
      disabled={busy}
      icon={post.isSaved ? <Bookmark sx={{ fontSize: 13 }} /> : <BookmarkBorder sx={{ fontSize: 13 }} />}
      label={post.isSaved ? 'Saved' : 'Save'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(post); }}
      aria-label={post.isSaved ? `Remove “${post.title}” from saved` : `Save “${post.title}” for later`}
      sx={{
        height: 22, fontFamily: MONO, fontSize: 10, cursor: 'pointer',
        background: post.isSaved ? 'rgba(148,188,227,0.16)' : 'transparent',
        color: post.isSaved ? ACCENT : 'text.secondary',
        border: `1px solid ${post.isSaved ? 'rgba(148,188,227,0.45)' : 'rgba(148,163,184,0.25)'}`,
        '& .MuiChip-icon': { color: 'inherit', ml: 0.6 },
        '&:hover': { background: 'rgba(148,188,227,0.12)', borderColor: 'rgba(148,188,227,0.45)', color: ACCENT },
      }}
    />
  );
}

export default function BlogPage({
  posts: initialPosts, archive, heading = 'AI News', intro = 'Daily field notes on AI-assisted engineering.',
  feedPath = '/feed.xml', emptyMessage, showSearch = true, onlySaved = false,
}: BlogPageProps) {
  const { posts, loading: archiveLoading, error: archiveError, retry: retryArchive } = usePostArchive(initialPosts, archive);
  const [view, setView] = useState<View>('cards');              // SSR default
  const [sizeOverride, setSizeOverride] = useState<Partial<Record<View, number>>>({});
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedCopied, setFeedCopied] = useState(false);
  // Empty until mount: this component prerenders, and window.location.origin
  // does not exist then. Only click handlers read the absolute URL.
  const [origin, setOrigin] = useState('');

  // ---- reader state --------------------------------------------------------
  // Both start in their signed-out shape and only ever leave it inside the
  // effect below. The prerendered HTML is therefore always the signed-out list,
  // and read/saved decoration lands after hydration — never in the static file.
  const [readerError, setReaderError] = useState(false);
  const [readerRetry, setReaderRetry] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [readerState, setReaderState] = useState<ReaderStateMap>(EMPTY_STATE);
  const [hideRead, setHideRead] = useState(false);
  /**
   * Post ids with a save/unsave write in flight. The ref is the guard and the
   * state is only what disables the chip: two clicks in the SAME tick both read
   * the render's captured state, which is still empty, so state alone lets the
   * second one through and `true` can land after `false`. A ref updates
   * synchronously, so the second click sees the first.
   */
  const pendingRef = useRef<Record<string, boolean>>({});
  const [pendingSaves, setPendingSaves] = useState<Record<string, boolean>>({});

  // What the Topics flyout lists: every tag except the ubiquitous "AI",
  // most-used first, with its slug and count. topicTags() is the ONE definition
  // shared with the feed/sitemap generators, so a pill's link and the page it
  // opens can never disagree about a slug.
  const topics: { tag: string; slug: string; count: number }[] = useMemo(() => archive?.topics ?? topicTags(posts), [posts, archive]);

  // Annotate first, then narrow. Every filter below operates on the same
  // annotated list, so Hide-read composes with topics, search and /saved
  // instead of replacing any of them.
  const annotated = useMemo(() => applyReaderState(posts, readerState), [posts, readerState]);

  // Filter (OR): a post matches if it carries any selected topic.
  const topicFiltered = useMemo(
    () => (selectedTags.length ? annotated.filter((p) => p.tags.some((t) => selectedTags.includes(t))) : annotated),
    [annotated, selectedTags],
  );

  // `hideRead` can only be true when signed in, but gate it anyway: the
  // signed-out list must be today's list under every combination of state.
  // selectVisiblePosts is where "saved beats hide-read" lives.
  const filteredPosts = useMemo(
    () => selectVisiblePosts(topicFiltered, { onlySaved, hideRead: hideRead && signedIn }),
    [topicFiltered, onlySaved, hideRead, signedIn],
  );

  const pageSize = sizeOverride[view] ?? PAGE_DEFAULT[view];
  const pageCount = Math.max(1, Math.ceil((archiveLoading ? archive!.total : filteredPosts.length) / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagePosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reconcile view + page-size prefs from localStorage and ?page/?topics from the URL.
  useEffect(() => {
    setOrigin(window.location.origin);
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

  // Reader state, tracked for as long as this list is mounted rather than
  // probed once: signing out has to take the decoration away without a reload
  // (otherwise the next person on a shared machine sees the last reader's
  // state), and signing in on this very page has to turn it on — AuthWidget
  // deliberately does not navigate when you are already on the destination.
  // A signed-out visitor never gets past watchReaderAuth's first line: no
  // supabase-js chunk, no request, no controls.
  // Only a CHANGE of reader reloads. TOKEN_REFRESHED arrives roughly hourly and
  // means nothing here; reloading on it would replace the state map wholesale,
  // which throws away an optimistic save that has not been confirmed yet — the
  // chip would flip back to "Save" and forward again as the write lands.
  const readerRef = useRef<string | null>(null);
  useEffect(() => {
    readerRef.current = null;
    setReaderError(false);
    let live = true;
    const stop = watchReaderAuth((userId) => {
      if (!live) return;
      if (!userId) {
        // Every setter here is idempotent, so the signed-out case (which
        // arrives synchronously on mount) bails out of re-rendering entirely.
        readerRef.current = null;
        setSignedIn(false);
        setReaderError(false);
        setReaderState(EMPTY_STATE);
        setHideRead(false);
        pendingRef.current = {};
        setPendingSaves((cur) => (Object.keys(cur).length ? {} : cur));
        return;
      }
      if (userId === readerRef.current) return;   // same reader, new token
      readerRef.current = userId;
      setReaderError(false);
      setReaderState(EMPTY_STATE);
      pendingRef.current = {};
      setPendingSaves({});
      setSignedIn(true);
      setHideRead(window.localStorage.getItem('ainews-hide-read') === '1');
      void loadReaderState().then((state) => {
        if (live && readerRef.current === userId) setReaderState(state);
      }).catch(() => {
        if (live && readerRef.current === userId) setReaderError(true);
      });
    });
    return () => { live = false; stop(); };
  }, [readerRetry]);

  // Keep the URL (?page, ?topics) in sync, clamped, on the CURRENT path (/ or /ai-news/,
  // also /ai-news/search/ where a foreign `?q=` must survive this rewrite).
  //
  // Skips its OWN first run. On mount `selectedTags`/`page` still hold their SSR
  // defaults, so writing the URL here would serialize empty state over an incoming
  // `?topics=…` — erasing the parameter before the effect above can apply it, and
  // taking the filter with it. That made every shared filter link land unfiltered
  // (`/?topics=Design` → `/`). Only sync once state can have come from somewhere.
  const urlSyncArmed = useRef(false);
  useEffect(() => {
    if (page !== safePage) { setPage(safePage); return; }
    if (!urlSyncArmed.current) { urlSyncArmed.current = true; return; }
    // Seed from the CURRENT query string and only touch the keys this effect owns —
    // a rebuild-from-scratch here would silently drop any other param a host page
    // relies on (e.g. /ai-news/search/'s `?q=`), and under React 18 StrictMode's
    // dev-only double-effect-invoke this "armed" branch can fire before that page's
    // own mount effect has read its query, corrupting the term it reads mid-flight.
    const params = new URLSearchParams(window.location.search);
    if (selectedTags.length) params.set('topics', selectedTags.join(',')); else params.delete('topics');
    if (safePage > 1) params.set('page', String(safePage)); else params.delete('page');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, view, pageSize, selectedTags]);

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

  const toggleHideRead = () => {
    setHideRead((prev) => {
      const next = !prev;
      window.localStorage.setItem('ainews-hide-read', next ? '1' : '0');
      return next;
    });
    setPage(1);
  };

  /** Replace one post's row, leaving every other reader-state entry alone. */
  const putRow = (postId: string, row: ReaderRow | undefined) => {
    setReaderState((cur) => {
      const next: ReaderStateMap = new Map();
      cur.forEach((v, k) => next.set(k, v));
      if (row) next.set(postId, row); else next.delete(postId);
      return next;
    });
  };

  // Optimistic: flip the pill immediately, revert just this post's row if the
  // write fails. read_at is carried over, so saving never forgets a read.
  // Ignored while a write for the same post is still in flight, so a rapid
  // double-click cannot land `true` after `false` or revert to a value the
  // server never confirmed.
  const toggleSaved = (post: ReaderPost) => {
    if (pendingRef.current[post.id] || readerError) return;
    const userId = readerRef.current;
    pendingRef.current[post.id] = true;
    const before = readerState.get(post.id);
    const saved = !post.isSaved;
    setPendingSaves((cur) => ({ ...cur, [post.id]: true }));
    putRow(post.id, { post_id: post.id, saved, read_at: before ? before.read_at : null });
    void setSaved(post.id, saved).then((ok) => {
      if (readerRef.current !== userId) return;
      delete pendingRef.current[post.id];
      if (!ok) putRow(post.id, before);
      setPendingSaves((cur) => ({ ...cur, [post.id]: false }));
    });
  };

  /** The signed-in extras for a card's pill row; undefined signed out. */
  const readerExtras = (post: ReaderPost): React.ReactNode => (signedIn ? (
    <>
      {post.isRead && <ReadChip />}
      <SaveChip post={post} onToggle={toggleSaved} busy={!!pendingSaves[post.id] || readerError} />
    </>
  ) : undefined);

  /**
   * Read posts recede rather than vanish — the archive stays browsable.
   *
   * Applied to the image, meta line, headline and excerpt, and NOT to the pill
   * row: opacity cannot be undone by a child, and at any dim that reads as
   * "receded" the tag pills and the Save control would fall under the 4.5:1
   * floor. 0.7 keeps the dimmed text itself legible too — text.secondary
   * lands at 4.76:1 (it was 3.47:1 at 0.55), the headline at 7.86:1.
   */
  const dim = (post: ReaderPost) => (signedIn && post.isRead ? { opacity: 0.7 } : null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.concat(tag)));
    setPage(1);
  };

  const clearTags = () => { setSelectedTags([]); setPage(1); };

  // The feed for what is selected right now. One topic already HAS a static
  // feed, so only a real multi-topic selection needs the Worker's ?topics=
  // merge; nothing selected is just this page's own feed.
  const feedUrlForSelection = useMemo(() => {
    // Slugs come from the same topics array the pills link to. A `?topics=` tag
    // that no post carries has no topic page and no feed, so it is dropped
    // rather than turned into a URL that 404s.
    const bySlug = new Map(topics.map((t) => [t.tag, t.slug]));
    const slugs = selectedTags.map((t) => bySlug.get(t)).filter(Boolean).sort() as string[];
    const path = slugs.length === 0 ? feedPath
      : slugs.length === 1 ? `/ai-news/topic/${slugs[0]}/feed.xml`
        : `/ai-news/feed.xml?topics=${slugs.join(',')}`;
    return `${origin}${path}`;
  }, [selectedTags, topics, feedPath, origin]);

  // Copy the feed URL rather than only linking it: most browsers render feed XML
  // as a wall of markup, and what a reader actually needs is the URL on their
  // clipboard to paste into a reader app. The <a> stays a real link so
  // middle-click / "open in new tab" / a browser extension still work.
  const copyFeedUrl = async () => {
    const url = `${window.location.origin}${feedPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setFeedCopied(true);
      window.setTimeout(() => setFeedCopied(false), 2000);
    } catch {
      window.open(feedPath, '_blank', 'noopener');   // clipboard blocked → just show it
    }
  };

  const metaLine = (post: BlogPost) => `${formatPublished(post)} · ${post.readTime} min read`;

  // ---- per-view renderers --------------------------------------------------

  const listView = (
    <Box>
      {pagePosts.map((post, i) => (
        <Box
          key={post.id}
          component={motion.div}
          initial={false} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25) }}
          sx={{ display: 'flex', gap: 2.5, py: 3, borderTop: border, alignItems: 'flex-start' }}
        >
          {post.image && (
            <Box component={Link} prefetch={false} href={`/ai-news/${post.id}/`} sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' }, ...dim(post) }}>
              <Box component="img" src={post.image} alt={post.title} loading="lazy"
                sx={{ width: 132, aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', borderRadius: 1.5, border }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em', ...dim(post) }}>
              {metaLine(post)}
            </Typography>
            <Typography component={Link} prefetch={false} href={`/ai-news/${post.id}/`}
              sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.15, color: 'text.primary', textDecoration: 'none', ...clamp(2), transition: 'color .2s ease', '&:hover': { color: LINK }, ...dim(post) }}>
              {post.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5, ...clamp(2), ...dim(post) }}>
              {post.excerpt}
            </Typography>
            <Pills post={post} extra={readerExtras(post)} />
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
            initial={false} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
            sx={{
              height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, border,
              position: 'relative', background: 'transparent', transition: 'border-color .2s ease, transform .2s ease',
              '&:hover': { borderColor: 'rgba(148,188,227,0.55)', transform: 'translateY(-2px)' },
            }}
          >
            <Corners />
            {post.image && (
              <Box component={Link} prefetch={false} href={`/ai-news/${post.id}/`} sx={{ display: 'block', ...dim(post) }}>
                <Box component="img" src={post.image} alt={post.title} loading="lazy"
                  sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, flexGrow: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em', ...dim(post) }}>
                {metaLine(post)}
              </Typography>
              <Typography component={Link} prefetch={false} href={`/ai-news/${post.id}/`}
                sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.2, color: 'text.primary', textDecoration: 'none', ...clamp(3), transition: 'color .2s ease', '&:hover': { color: LINK }, ...dim(post) }}>
                {post.title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.5, ...clamp(3), ...dim(post) }}>
                {post.excerpt}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 0.5 }}><Pills post={post} extra={readerExtras(post)} /></Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const feedView = (
    <Box>
      {pagePosts.map((post, i) => {
        return (
          <Box
            key={post.id}
            component={motion.article}
            initial={false} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
            sx={{ py: { xs: 4, md: 6 }, borderTop: border }}
          >
            {post.image && (
              <Box component={Link} prefetch={false} href={`/ai-news/${post.id}/`} sx={{ display: 'block', mb: 2.5, border, ...dim(post) }}>
                <Box component="img" src={post.image} alt={post.title} loading="lazy"
                  sx={{ width: '100%', maxHeight: 320, aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', letterSpacing: '0.04em', mb: 1.5, ...dim(post) }}>
              {metaLine(post)}
            </Typography>
            <Typography component={Link} prefetch={false} href={`/ai-news/${post.id}/`}
              sx={{ display: 'block', fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.7rem', md: '2.2rem' }, lineHeight: 1.12, letterSpacing: '-0.015em', mb: 1.5, color: 'text.primary', textDecoration: 'none', transition: 'color 0.22s ease', '&:hover': { color: LINK }, ...dim(post) }}>
              {post.title}
            </Typography>
            <Box sx={{ mb: 2.5 }}><Pills post={post} extra={readerExtras(post)} /></Box>
            <Box sx={{ ...markdownSx, ...dim(post) }}>
              <FeedBody url={post.bodyPath} content={post.content} />
            </Box>
          </Box>
        );
      })}
      <Box sx={{ borderTop: border }} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      {readerError && <ReaderStateNotice onRetry={() => setReaderRetry((n) => n + 1)} />}
      {/* Masthead */}
      <Box component={motion.div} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography sx={{ fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5 }}>
          CloudCodeTree&nbsp;·&nbsp;Journal
        </Typography>
        <Typography component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' }, lineHeight: 0.95, letterSpacing: '-0.02em', m: 0, background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {heading}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 560 }}>
            {typeof intro === 'function' ? intro(filteredPosts.length) : intro}
          </Typography>
        </Box>

        {/* Subscribe: the feed URL, copyable. Every post ships in full text. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 3, flexWrap: 'wrap' }}>
          <Box
            component="a"
            href={feedPath}
            onClick={(e: React.MouseEvent) => { e.preventDefault(); copyFeedUrl(); }}
            aria-label={feedCopied ? "Feed URL copied" : "Subscribe via RSS — copy feed URL"}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.85, cursor: 'pointer',
              textDecoration: 'none', fontFamily: MONO, fontSize: 12, lineHeight: 1,
              color: feedCopied ? ACCENT : 'text.secondary',
              border: `1px solid ${feedCopied ? 'rgba(63,185,80,0.45)' : 'rgba(148,163,184,0.22)'}`,
              background: feedCopied ? 'rgba(63,185,80,0.1)' : 'transparent',
              borderRadius: 999, px: 1.5, py: 0.9,
              transition: 'color .15s, border-color .15s, background .15s',
              '&:hover': { color: ACCENT, borderColor: 'rgba(63,185,80,0.45)' },
            }}
          >
            {feedCopied ? <Check sx={{ fontSize: 15 }} /> : <RssFeed sx={{ fontSize: 15 }} />}
            {feedCopied ? 'Feed URL copied' : 'Subscribe via RSS'}
            {!feedCopied && <ContentCopy sx={{ fontSize: 13, opacity: 0.6 }} />}
          </Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
            cloudcodetree.com{feedPath}&nbsp;·&nbsp;full text, no tracking
          </Typography>
        </Box>
      </Box>

      {/* Controls: view switcher + page size */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          {showSearch && <SearchBox />}
          {topics.length > 0 && (
            <TopicsFlyout
              topics={topics}
              selected={selectedTags}
              onToggle={toggleTag}
              onClear={clearTags}
              feedUrlForSelection={feedUrlForSelection}
            />
          )}
          {/* Signed-in only: a control a signed-out reader cannot use is worse
              than no control. Sits beside Topics and narrows what those leave.
              Absent on /saved, where it has nothing to do — an explicit save
              outranks read state there, so the toggle would be a dead switch. */}
          {signedIn && !onlySaved && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOff />}
              onClick={toggleHideRead}
              aria-pressed={hideRead}
              sx={{
                fontFamily: MONO, fontSize: 12, textTransform: 'none',
                color: hideRead ? '#1d1f20' : 'text.secondary',
                background: hideRead ? ACCENT : 'transparent',
                borderColor: hideRead ? ACCENT : 'rgba(148,163,184,0.25)',
                '&:hover': hideRead
                  ? { background: ACCENT, borderColor: ACCENT }
                  : { borderColor: ACCENT, color: ACCENT, background: 'rgba(148,188,227,0.08)' },
              }}
            >
              Hide read
            </Button>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>Per page</Typography>
            <Select value={pageSize} inputProps={{ 'aria-label': 'Posts per page' }} onChange={(e) => choosePageSize(Number(e.target.value))} size="small"
              sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' }, '.MuiSvgIcon-root': { color: 'text.secondary' } }}>
              {PAGE_OPTIONS.map((n) => <MenuItem key={n} value={n} sx={{ fontFamily: MONO, fontSize: 12 }}>{n}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, v) => chooseView(v)} aria-label="Choose layout"
          sx={{ '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)', px: 1.25 }, '& .Mui-selected': { color: `${ACCENT} !important`, background: 'rgba(148,188,227,0.12) !important' } }}>
          <ToggleButton value="list" aria-label="Compact list"><ViewList fontSize="small" /></ToggleButton>
          <ToggleButton value="cards" aria-label="Cards"><GridView fontSize="small" /></ToggleButton>
          <ToggleButton value="feed" aria-label="Full feed"><ViewStream fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {archiveError && <Alert severity="warning" action={<Button onClick={retryArchive}>Retry</Button>}>The archive could not be loaded. Recent posts are still available.</Alert>}
      {archiveLoading && (safePage > 1 || selectedTags.length > 0) ? <Typography role="status">Loading posts…</Typography> : filteredPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>
            {emptyMessage
              ?? (posts.length === 0 ? '// no posts yet'
                : hideRead && signedIn && !onlySaved
                  ? '// everything here is already read — switch off Hide read'
                  : '// no posts match those topics — clear a filter above')}
          </Typography>
        </Box>
      ) : (
        <>
          {view === 'list' ? listView : view === 'cards' ? cardsView : feedView}

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination count={pageCount} page={safePage} onChange={(_, v) => goToPage(v)} shape="rounded"
                sx={{ '& .MuiPaginationItem-root': { fontFamily: MONO, color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)' }, '& .Mui-selected': { background: `${ACCENT} !important`, color: '#1d1f20', borderColor: ACCENT } }} />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
