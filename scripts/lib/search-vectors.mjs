export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function meanVector(vs) {
  const out = new Array(vs[0].length).fill(0);
  for (const v of vs) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out.map((x) => x / vs.length);
}

export function encodeVector(v) {
  return Buffer.from(new Float32Array(v).buffer).toString('base64');
}

export function decodeVector(s) {
  const buf = Buffer.from(s, 'base64');
  return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
}

/**
 * For every entry, its k nearest by cosine with a small recency nudge so a
 * near-tie favors the newer post. `date` is any monotonic number (epoch days).
 */
export function relatedFor(entries, { k = 5, recencyWeight = 0.02 } = {}) {
  const dates = entries.map((e) => e.date);
  const min = Math.min(...dates), max = Math.max(...dates);
  const recency = (d) => (max === min ? 0 : (d - min) / (max - min));
  const out = {};
  for (const self of entries) {
    out[self.id] = entries
      .filter((o) => o.id !== self.id)
      .map((o) => ({ id: o.id, score: cosine(self.vector, o.vector) + recencyWeight * recency(o.date) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, k)
      .map((x) => x.id);
  }
  return out;
}
