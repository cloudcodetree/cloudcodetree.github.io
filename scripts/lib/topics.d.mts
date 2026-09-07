export const HIDDEN_TAG: string;
export function slugForTag(tag: string): string;
export function topicTags(posts: { tags: string[] }[]): { tag: string; slug: string; count: number }[];
