/**
 * cf-search.mjs — the three Cloudflare calls the search indexer makes.
 *
 *   embed()            Workers AI REST, @cf/baai/bge-base-en-v1.5 (768 d)
 *   vectorizeUpsert()  Vectorize v2 REST, ndjson body
 *   vectorizeDelete()  Vectorize v2 REST, JSON { ids }
 *
 * plus the indexer's own state on the existing R2 bucket (public read via
 * img.cloudcodetree.com, write via r2Put): the manifest and a mirror of
 * related.json. Both keys are FLAT — r2Put percent-encodes the key, so a `/`
 * in it would write one object and read back another (a silent 404 that
 * re-embeds the whole corpus every run). The token is the CI token (Workers
 * AI Read + Vectorize Edit + R2 Edit); its value never enters tool output.
 */
import { API, IMG_ORIGIN, cfCredentials, r2Put } from './r2.mjs';

export const INDEX_NAME = 'cct-search';
export const MODEL = '@cf/baai/bge-base-en-v1.5';
export const MANIFEST_KEY = 'search-manifest.json';
export const RELATED_KEY = 'search-related.json';
const EMBED_BATCH = 50;
const VEC_BATCH = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cf(pathname, init, attempts = 3) {
  const { token, accountId } = cfCredentials();
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  const url = `${API}/accounts/${accountId}/${pathname}`;
  let last;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(500 * 2 ** i);
    const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) } });
    if (res.status >= 500 || res.status === 429) { last = new Error(`${pathname}: HTTP ${res.status}`); continue; }
    let json;
    try { json = await res.json(); } catch { throw new Error(`${pathname}: HTTP ${res.status} returned a non-JSON body`); }
    if (!res.ok || json.success === false) {
      throw new Error(`${pathname}: HTTP ${res.status} ${JSON.stringify(json.errors || '')}`);
    }
    return json.result;
  }
  throw last;
}

export async function embed(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const result = await cf(`ai/run/${MODEL}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: batch }),
    });
    out.push(...result.data);
  }
  return out;
}

export async function vectorizeUpsert(vectors) {
  for (let i = 0; i < vectors.length; i += VEC_BATCH) {
    const body = vectors.slice(i, i + VEC_BATCH).map((v) => JSON.stringify(v)).join('\n') + '\n';
    await cf(`vectorize/v2/indexes/${INDEX_NAME}/upsert`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-ndjson' },
      body,
    });
  }
}

export async function vectorizeDelete(ids) {
  for (let i = 0; i < ids.length; i += VEC_BATCH) {
    await cf(`vectorize/v2/indexes/${INDEX_NAME}/delete_by_ids`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ids.slice(i, i + VEC_BATCH) }),
    });
  }
}

/** The last run's manifest, read through the public bucket domain (cache-busted). */
export async function getManifest() {
  const res = await fetch(`${IMG_ORIGIN}/${MANIFEST_KEY}?v=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`manifest: HTTP ${res.status}`);
  return res.json();
}

export async function putManifest(manifest) {
  await r2Put(MANIFEST_KEY, JSON.stringify(manifest), 'application/json', 'no-cache');
}

/**
 * The last run's related.json, mirrored to R2 so a tokenless build (a PR, a
 * local build, a run where the secret is missing) can serve the previous
 * neighbors instead of an empty strip. Same read path as the manifest.
 */
export async function getRelated() {
  const res = await fetch(`${IMG_ORIGIN}/${RELATED_KEY}?v=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`related: HTTP ${res.status}`);
  return res.json();
}

export async function putRelated(related) {
  await r2Put(RELATED_KEY, JSON.stringify(related), 'application/json', 'no-cache');
}
