/** Only these fixed labels may leave the search handler. Never return query text. */
export const SEARCH_TOPICS = ['rag', 'agents', 'mcp', 'claude-code', 'fine-tuning', 'embeddings', 'security', 'cloud', 'design', 'other'];
export function topicForQuery(query) {
  const normalized = String(query).trim().toLowerCase().replace(/\s+/g, '-');
  return SEARCH_TOPICS.includes(normalized) ? normalized : 'other';
}
export const isSearchTopic = (topic) => SEARCH_TOPICS.includes(topic);
