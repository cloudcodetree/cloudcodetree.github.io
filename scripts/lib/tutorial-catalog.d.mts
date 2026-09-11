export function tutorialReaderId(slug: string): string;
export function tutorialTopics(tutorials: { tags: string[]; draft?: boolean }[]): { tag: string; slug: string; count: number }[];
export function filterTutorials<T extends { title: string; excerpt: string; series: string; tags: string[]; draft?: boolean }>(tutorials: T[], options?: { topics?: string[]; query?: string; series?: string | null }): T[];
