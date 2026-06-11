import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../components/ClientLayout';
import BlogPost from '../../components/BlogPost';
import type { BlogPost as Post } from '../../components/blogShared';

function readPosts(): Post[] {
  // Content still lives under public/blog/ (asset path); only the page route moved.
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Post[];
}

// Pre-render every post as a static page (required for output: 'export').
export function generateStaticParams() {
  return readPosts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = readPosts().find((p) => p.id === id);
  if (!post) return { title: 'AI News | Chris Harper' };
  const url = `https://cloudcodetree.com/ai-news/${id}/`;
  return {
    title: `${post.title} | AI News`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'CloudCodeTree',
      type: 'article',
      ...(post.image ? { images: [{ url: post.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Bake the post into the static HTML — no client-side fetch.
  const post = readPosts().find((p) => p.id === id);
  if (!post) notFound();
  return (
    <ClientLayout>
      <BlogPost post={post} />
    </ClientLayout>
  );
}
