/**
 * r2.mjs — blog image hosting on Cloudflare R2.
 *
 * Bucket `cct-blog-images` is served publicly at https://img.cloudcodetree.com
 * (an R2 custom domain: Cloudflare sets content types and edge-caches the
 * objects; no Worker code involved). Uploads go through the Cloudflare API's
 * R2 object endpoint — the same one `wrangler r2 object put` uses — with the
 * CLOUDFLARE_API_TOKEN (Workers R2 Storage: Edit), read from the environment
 * (CI) or from .env (local). The token value never enters tool output.
 *
 * Every object is immutable per key (<post-id>.jpg), so it is uploaded with a
 * one-year cache lifetime; re-hosting an image under the same key needs a
 * cache purge (`node scripts/cf-zone.mjs purge`) to show up immediately.
 */
import { readFileSync } from 'node:fs';

export const R2_BUCKET = 'cct-blog-images';
export const IMG_ORIGIN = 'https://img.cloudcodetree.com';
/** The previous home of every image; still valid, kept as a fallback. */
export const LEGACY_CDN = 'https://github.com/cloudcodetree/cloudcodetree.github.io/releases/download/blog-images';
export const PLACEHOLDER = `${IMG_ORIGIN}/_default.png`;

const ACCOUNT_ID_DEFAULT = '2473c9873f03835b5779ea7c11d41106'; // public identifier
const API = 'https://api.cloudflare.com/client/v4';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

function parseEnv(p) {
  const out = {};
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}

let creds;
function credentials() {
  if (creds) return creds;
  const env = { ...parseEnv('.env'), ...parseEnv('.env.local'), ...process.env };
  creds = {
    token: env.CLOUDFLARE_API_TOKEN || env.CLODFLARE_API_TOKEN || '',
    accountId: env.CLOUDFLARE_ACCOUNT_ID || ACCOUNT_ID_DEFAULT,
  };
  return creds;
}

/** True when an upload token is available (CI secret or .env). */
export function r2Ready() {
  return Boolean(credentials().token);
}

/** Public URL of an object key. */
export function imageUrl(key) {
  return `${IMG_ORIGIN}/${key}`;
}

/** True if `url` is one of ours (R2 now, or the legacy GitHub Release). */
export function isHosted(url) {
  return typeof url === 'string' && (url.startsWith(IMG_ORIGIN + '/') || url.startsWith(LEGACY_CDN + '/'));
}

export function contentTypeFor(key) {
  const ext = key.toLowerCase().split('.').pop();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' }[ext] || 'application/octet-stream';
}

/** Upload bytes as `key`. Overwrites. Throws on failure. */
export async function r2Put(key, body, contentType = contentTypeFor(key)) {
  const { token, accountId } = credentials();
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  const res = await fetch(`${API}/accounts/${accountId}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': contentType, 'cache-control': CACHE_CONTROL },
    body,
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify((await res.json()).errors); } catch {}
    throw new Error(`R2 put ${key}: HTTP ${res.status} ${detail}`);
  }
  return imageUrl(key);
}

/**
 * Does the public URL for `key` answer with an image?
 * The check carries a throwaway query string so it never hits — or plants —
 * an edge-cached 404 on the canonical URL (Cloudflare caches 404s for a few
 * minutes; a pre-upload probe followed by a post-upload probe on the same URL
 * would otherwise report a fresh object as missing).
 */
export async function r2Exists(key) {
  try {
    const res = await fetch(`${imageUrl(key)}?check=${Date.now()}`, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    return res.ok && (res.headers.get('content-type') || '').startsWith('image/');
  } catch { return false; }
}
