'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Alert, Button, Skeleton } from '@mui/material';
const BlogMarkdown = dynamic(() => import('./BlogMarkdown'), { loading: () => <Skeleton height={120} /> });
const bodies = new Map<string, string>();

export default function FeedBody({ url, content }: { url?: string; content?: string }) {
  const [body, setBody] = useState(content ?? (url ? bodies.get(url) : undefined));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url || content !== undefined) return;
    if (bodies.has(url)) { setBody(bodies.get(url)); return; }
    const controller = new AbortController();
    setError(false);
    fetch(url, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Article unavailable');
      const data = await response.json();
      if (typeof data.content !== 'string') throw new Error('Invalid article');
      if (!controller.signal.aborted) { bodies.set(url, data.content); setBody(data.content); }
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [url, content, attempt]);
  if (error) return <Alert severity="warning" action={<Button onClick={() => setAttempt((n) => n + 1)}>Retry</Button>}>This article could not be loaded.</Alert>;
  return body === undefined ? <Skeleton height={120} /> : <BlogMarkdown content={body} />;
}
