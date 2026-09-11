import { topicTags } from './topics.mjs';

/** Same identity as tutorial RSS; distinct from date-prefixed blog post IDs. */
export function tutorialReaderId(slug) {
  const id = `tutorial-${slug}`;
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(id)) throw new Error('Invalid tutorial reader ID');
  return id;
}

export function tutorialTopics(tutorials) {
  return topicTags(tutorials.filter((t) => !t.draft).map((t) => ({
    tags: (t.tags || []).filter((tag) => tag.toLowerCase() !== 'tutorial'),
  })));
}

/** Topics combine with OR; search and course scope narrow that selection. */
export function filterTutorials(tutorials, { topics = [], query = '', series = null } = {}) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tutorials.filter((t) => !t.draft && (!series || t.series === series)
    && (!topics.length || topics.some((tag) => t.tags.includes(tag)))
    && words.every((word) => [t.title, t.excerpt, t.series, ...t.tags].join(' ').toLowerCase().includes(word)));
}
