import { createHash } from 'node:crypto';
import { topicTags } from './topics.mjs';
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 20);

/** Content-addressed files: older chunks keep their URLs when new posts arrive. */
export function buildArchive(posts) {
  const bodies = posts.map((post) => {
    const text = JSON.stringify({ id: post.id, content: post.content || '' });
    return { url: `/blog/bodies/${hash(text)}.json`, text };
  });
  const slim = posts.map(({ content, ...post }, i) => ({ ...post, bodyPath: bodies[i].url }));
  const chunks = [];
  // Anchor groups at the oldest end; adding a new post only changes the newest group.
  for (let end = slim.length; end > 0; end -= 100) {
    const text = JSON.stringify(slim.slice(Math.max(0, end - 100), end));
    chunks.unshift({ url: `/blog/archive/${hash(text)}.json`, text });
  }
  return { slim, chunks, bodies };
}
export function listing(archive, topic) {
  const posts = topic ? archive.slim.filter((p) => p.tags.includes(topic)) : archive.slim;
  return {
    initial: posts.slice(0, 20),
    archive: { urls: archive.chunks.map((c) => c.url), total: posts.length, topics: topicTags(posts), ...(topic ? { topic } : {}) },
  };
}
