import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../../components/ClientLayout';
import BlogPage from '../../../components/BlogPage';
import { blogListing } from '../../../lib/blogArchive';
import type { BlogPost } from '../../../components/blogShared';
import { topicTags } from '../../../../scripts/lib/topics.mjs';

function readPosts(): BlogPost[] {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
}

// One static page per topic tag (every tag except AI). A new tag in the feed
// gets its page on the next build — generate-feeds.mjs adds the matching feed
// and sitemap entry from the same topicTags() list.
export function generateStaticParams() {
  return topicTags(readPosts()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicTags(readPosts()).find((t) => t.slug === slug);
  if (!topic) return { title: 'AI News · CloudCodeTree' };
  const url = `https://cloudcodetree.com/ai-news/topic/${slug}/`;
  return {
    title: `${topic.tag} · AI News · CloudCodeTree`,
    description: `${topic.count} AI News post${topic.count === 1 ? '' : 's'} tagged ${topic.tag}: daily field notes on AI-assisted engineering.`,
    alternates: { canonical: url, types: { 'application/rss+xml': `${url}feed.xml` } },
    openGraph: { title: `${topic.tag} · AI News`, url, siteName: 'CloudCodeTree', type: 'website' },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = readPosts();
  const topic = topicTags(posts).find((t) => t.slug === slug);
  if (!topic) notFound();
  const { initial, archive } = blogListing(topic.tag);
  return (
    <ClientLayout>
      <BlogPage
        posts={initial}
        archive={archive}
        heading={topic.tag}
        intro={`${topic.count} post${topic.count === 1 ? '' : 's'} tagged ${topic.tag}.`}
        feedPath={`/ai-news/topic/${slug}/feed.xml`}
        topic={{ tag: topic.tag, slug }}
      />
    </ClientLayout>
  );
}
