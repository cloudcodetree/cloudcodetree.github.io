'use client';
import { useEffect, useState } from 'react';
import type { BlogPost } from '../components/blogShared';

export interface PostArchive {
  urls: string[];
  total: number;
  topics: { tag: string; slug: string; count: number }[];
  topic?: string;
}
const pending = new Map<string, Promise<BlogPost[]>>();
function readChunk(url: string) {
  let request = pending.get(url);
  if (!request) {
    request = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error('Archive unavailable');
      const posts = await response.json();
      if (!Array.isArray(posts)) throw new Error('Invalid archive');
      return posts as BlogPost[];
    }).catch((error) => { pending.delete(url); throw error; });
    pending.set(url, request);
  }
  return request;
}

/** The first page is HTML; the remaining metadata arrives as reusable chunks. */
export function usePostArchive(initial: BlogPost[], archive?: PostArchive, enabled = true) {
  const [result, setResult] = useState<{ key: string; topic?: string; posts: BlogPost[] } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = archive?.urls.join(',') ?? '';
  const topic = archive?.topic;
  const loaded = result?.key === key && result?.topic === topic ? result.posts : null;
  useEffect(() => {
    if (!key || !enabled) return;
    let live = true;
    setError(false);
    Promise.all(key.split(',').map(readChunk)).then((chunks) => {
      if (live) setResult({ key, topic, posts: chunks.flat().filter((p) => !topic || p.tags.includes(topic)) });
    }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [key, topic, attempt, enabled]);
  return { posts: loaded ?? initial, loading: !!archive && !loaded, error, retry: () => setAttempt((n) => n + 1) };
}
