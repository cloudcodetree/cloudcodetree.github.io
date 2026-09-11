'use client';
import { Chip } from '@mui/material';
import { Bookmark, BookmarkBorder } from '@mui/icons-material';
import { MONO, ACCENT } from './blogShared';

/** "Read" marker — same geometry as a tag pill, in the accent rather than amber. */
export function ReadChip() {
  return (
    <Chip label="Read" size="small"
      sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(148,188,227,0.08)', color: ACCENT, border: `1px solid rgba(148,188,227,0.3)` }} />
  );
}

/** Save / unsave, sitting in the pill row. Optimistic; reverts if the write fails. */
export function SaveChip<T extends { title: string; isSaved: boolean }>({ post, onToggle, busy }: { post: T; onToggle: (post: T) => void; busy: boolean }) {
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
