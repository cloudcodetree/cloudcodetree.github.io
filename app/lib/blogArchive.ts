import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { buildArchive, listing } from '../../scripts/lib/blog-archive.mjs';

const readArchive = cache(() => buildArchive(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/blog/posts.json'), 'utf8'))));
export function blogListing(topic?: string) { return listing(readArchive(), topic); }
