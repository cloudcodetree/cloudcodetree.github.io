'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Box, InputBase, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MONO, SERIF, ACCENT, LINK, formatLongDate } from './blogShared';
import { loadIndex, hybridSearch, type SearchDoc } from '../lib/searchIndex';

const DEBOUNCE_MS = 250;
const SHOW = 8;
const border = '1px solid rgba(148,163,184,0.22)';

export default function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SearchDoc[]>([]);
  const [semantic, setSemantic] = useState(false);
  const [active, setActive] = useState(-1);
  const seq = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Instant keyword pass on every keystroke; semantic merge after a pause.
  useEffect(() => {
    const term = q.trim();
    abort.current?.abort();
    if (!term) { setRows([]); setSemantic(false); setActive(-1); return; }
    const mine = ++seq.current;
    loadIndex().then(({ docs, keyword }) => {
      if (mine !== seq.current) return;
      setRows(keyword(term).slice(0, SHOW).map((id) => docs.get(id)!).filter(Boolean));
    }).catch(() => {});
    const ctl = new AbortController();
    abort.current = ctl;
    const t = window.setTimeout(async () => {
      try {
        const { ids, semantic: ok } = await hybridSearch(term, { signal: ctl.signal });
        if (mine !== seq.current) return;
        const { docs } = await loadIndex();
        setRows(ids.slice(0, SHOW).map((id) => docs.get(id)!).filter(Boolean));
        setSemantic(ok);
      } catch { /* keyword rows stand */ }
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(t); ctl.abort(); };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const resultsHref = `/ai-news/search/?q=${encodeURIComponent(q.trim())}`;
  const items = rows.length; // + 1 for "See all results"

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') { setOpen(false); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (!q.trim()) return;
      if (active >= 0 && active < items) router.push(`/ai-news/${rows[active].id}/`);
      else router.push(resultsHref);
      setOpen(false);
    }
  };

  const showList = open && q.trim().length > 0;

  return (
    <Box ref={wrap} sx={{ position: 'relative', width: { xs: '100%', sm: 320 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, border, borderRadius: 999, background: 'rgba(43,43,45,0.6)', '&:focus-within': { borderColor: ACCENT } }}>
        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <InputBase
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => { setOpen(true); loadIndex().catch(() => {}); }}
          onKeyDown={onKey}
          placeholder="Search AI News"
          inputProps={{ 'aria-label': 'Search AI News', 'aria-controls': listId, 'aria-expanded': showList, 'aria-autocomplete': 'list', role: 'combobox' }}
          sx={{ flex: 1, fontFamily: MONO, fontSize: 13, color: 'text.primary' }}
        />
      </Box>

      {showList && (
        <Box id={listId} role="listbox" sx={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20, border, borderRadius: 1, background: '#1d1f20', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
          {rows.length === 0 && (
            <Typography sx={{ p: 1.5, fontFamily: MONO, fontSize: 12, color: 'text.secondary' }}>{'// no matches yet'}</Typography>
          )}
          {rows.map((d, i) => (
            <Box key={d.id} component={Link} href={`/ai-news/${d.id}/`} role="option" aria-selected={active === i}
              onMouseEnter={() => setActive(i)} onClick={() => setOpen(false)}
              sx={{ display: 'block', px: 1.5, py: 1.1, textDecoration: 'none', borderTop: i ? border : 'none', background: active === i ? 'rgba(148,188,227,0.12)' : 'transparent' }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: 'text.primary' }}>{d.title}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary', mt: 0.4 }}>
                {formatLongDate(d.date)}{d.tags.filter((t) => t.toLowerCase() !== 'ai').slice(0, 2).map((t) => ` · ${t}`).join('')}
              </Typography>
            </Box>
          ))}
          <Box component={Link} href={resultsHref} role="option" aria-selected={active === items}
            onMouseEnter={() => setActive(items)} onClick={() => setOpen(false)}
            sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, textDecoration: 'none', borderTop: border, background: active === items ? 'rgba(148,188,227,0.12)' : 'transparent' }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: LINK }}>See all results →</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary' }}>{semantic ? 'keyword + meaning' : 'keyword'}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
