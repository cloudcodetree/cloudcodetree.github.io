/**
 * Topic tags → URL slugs. The ONE definition for scripts (feeds, sitemap) and
 * app code (topic routes, chip links), so a page and its feed can never
 * disagree about a slug.
 */
export const HIDDEN_TAG = 'ai'; // on every post; never a topic

export function slugForTag(tag) {
  return String(tag)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Every topic with its post count, most-used first, ties alphabetical. */
export function topicTags(posts) {
  const counts = new Map();
  for (const p of posts) {
    for (const t of p.tags || []) {
      if (t.toLowerCase() === HIDDEN_TAG) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: slugForTag(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
