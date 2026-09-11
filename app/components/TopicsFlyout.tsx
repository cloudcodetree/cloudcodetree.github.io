'use client';

import { useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, IconButton, Popover, TextField, Typography } from '@mui/material';
import { ArrowOutward, Check, ContentCopy, FilterList, RssFeed } from '@mui/icons-material';
import Link from 'next/link';
import { MONO, ACCENT } from './blogShared';

export interface TopicsFlyoutProps {
  /**
   * Every topic with its slug and post count, most-used first (the caller's
   * order is kept). Slugs arrive as data — this component never derives one,
   * so there is exactly one slug source on the page.
   */
  topics: { tag: string; slug: string; count: number }[];
  topicBasePath?: string;
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
  /** Absolute feed URL for the CURRENT selection — see BlogPage's three-way rule. */
  feedUrlForSelection: string;
}

/**
 * The topic filter, folded into a flyout.
 *
 * Thirty-nine chips across the top of the page were a wall of text that pushed
 * the posts below the fold and left no room for both jobs a topic has: filter
 * this list, or go read that topic's own page. In the flyout each pill does one
 * of those — the chip toggles the filter, the arrow beside it links out — and
 * the page keeps a one-line trigger plus a removable chip per selected topic.
 *
 * State: this component owns only "is it open" and the filter text. The
 * selection itself stays in BlogPage, which also owns the ?topics= URL sync, so
 * a shared link and the flyout can never disagree.
 */
export default function TopicsFlyout({ topics, selected, onToggle, onClear, feedUrlForSelection, topicBasePath = '/ai-news/topic' }: TopicsFlyoutProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const filterRef = useRef<HTMLInputElement>(null);

  const close = () => { setAnchorEl(null); setFilter(''); };

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? topics.filter(({ tag }) => tag.toLowerCase().includes(q)) : topics;
  }, [topics, filter]);

  // Same "copied" affordance as the masthead subscribe link: most browsers show
  // feed XML as a wall of markup, so what a reader wants is the URL on their
  // clipboard. Falls back to opening the feed when the clipboard is blocked.
  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrlForSelection);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(feedUrlForSelection, '_blank', 'noopener');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterList />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchorEl)}
        sx={{
          fontFamily: MONO, fontSize: 12, textTransform: 'none', color: 'text.secondary',
          borderColor: 'rgba(148,163,184,0.25)',
          '&:hover': { borderColor: ACCENT, color: ACCENT, background: 'rgba(148,188,227,0.08)' },
        }}
      >
        {selected.length ? `Topics · ${selected.length}` : 'Topics'}
      </Button>

      {selected.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          // A deletable Chip is a focusable button (Backspace removes it), so
          // name it for what pressing it does — "Claude Code" alone says nothing.
          aria-label={`Remove ${tag} from the filter`}
          onDelete={() => onToggle(tag)}
          sx={{
            fontFamily: MONO, fontSize: 11, color: '#1d1f20', background: ACCENT,
            '& .MuiChip-label': { px: 1 },
            '& .MuiChip-deleteIcon': { color: 'rgba(29,31,32,0.6)', '&:hover': { color: '#1d1f20' } },
          }}
        />
      ))}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          // The Modal's focus trap lands on the paper, so `autoFocus` alone
          // leaves the filter unfocused: put the caret there once it is open.
          transition: { onEntered: () => filterRef.current?.focus() },
          paper: {
            sx: {
              width: 360, maxWidth: '92vw', maxHeight: '70vh',
              display: 'flex', flexDirection: 'column',
              border: '1px solid rgba(148,163,184,0.2)', borderRadius: 1, backgroundImage: 'none',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            size="small"
            autoFocus
            fullWidth
            placeholder="Filter topics"
            inputRef={filterRef}
            inputProps={{ 'aria-label': 'Filter topics' }}
            sx={{ '& .MuiInputBase-input': { fontFamily: MONO, fontSize: 12 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' } }}
          />
        </Box>

        {/* minHeight: 0 — without it this flex child refuses to shrink below its
            content, and the list would push the footer out instead of scrolling. */}
        <Box sx={{ px: 1.5, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '6px', alignContent: 'flex-start' }}>
          {shown.length === 0 && (
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', py: 1 }}>
              {`// no topic matches “${filter.trim()}”`}
            </Typography>
          )}
          {shown.map(({ tag, slug, count }) => {
            const on = selected.includes(tag);
            return (
              // The chip and its link icon travel together: one inline-flex unit,
              // so wrapping can never strand an arrow on the next line.
              <Box key={tag} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                <Chip
                  label={`${tag} ${count}`}
                  size="small"
                  role="button"
                  aria-pressed={on}
                  onClick={() => onToggle(tag)}
                  sx={{
                    fontFamily: MONO, fontSize: 11, cursor: 'pointer',
                    color: on ? '#1d1f20' : 'text.secondary',
                    background: on ? ACCENT : 'transparent',
                    border: '1px solid', borderColor: on ? ACCENT : 'rgba(148,163,184,0.25)',
                    '& .MuiChip-label': { px: 1 },
                    '&:hover': { background: on ? ACCENT : 'rgba(148,188,227,0.12)' },
                  }}
                />
                <IconButton
                  component={Link}
                  href={`${topicBasePath}/${slug}/`}
                  prefetch={false}
                  size="small"
                  aria-label={`Open the ${tag} topic page`}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: ACCENT } }}
                >
                  <ArrowOutward sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          {selected.length > 0 ? (
            <Button size="small" onClick={onClear} sx={{ fontFamily: MONO, fontSize: 11, textTransform: 'none', color: 'text.secondary', '&:hover': { color: ACCENT } }}>
              Clear
            </Button>
          ) : <Box />}
          <Button
            size="small"
            onClick={copyFeedUrl}
            startIcon={copied ? <Check sx={{ fontSize: 15 }} /> : <RssFeed sx={{ fontSize: 15 }} />}
            endIcon={copied ? undefined : <ContentCopy sx={{ fontSize: 13, opacity: 0.6 }} />}
            sx={{ fontFamily: MONO, fontSize: 11, textTransform: 'none', color: copied ? ACCENT : 'text.secondary', '&:hover': { color: ACCENT } }}
          >
            {copied ? 'Feed URL copied' : 'Subscribe to this selection'}
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
