import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../components/ClientLayout';
import BlogPost from '../../components/BlogPost';

interface PostMeta {
  id: string;
  title: string;
  excerpt: string;
}

function readPosts(): PostMeta[] {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as PostMeta[];
}

// Pre-render every post as a static page (required for output: 'export').
export function generateStaticParams() {
  return readPosts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = readPosts().find((p) => p.id === id);
  return {
    title: post ? `${post.title} | AI News` : 'AI News | Chris Harper',
    description: post?.excerpt,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientLayout>
      <BlogPost id={id} />
    </ClientLayout>
  );
}
