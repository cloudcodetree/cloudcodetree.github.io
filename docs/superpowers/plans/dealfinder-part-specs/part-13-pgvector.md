# Part 13 — pgvector persistence + semantic search over live deals

**Slug:** `dealfinder-pgvector`
**Phase:** P2 — Intelligence layer
**Data mode:** LIVE+INFRA

---

## 1. Objective

Add a Postgres + pgvector persistence layer to DealFinder so that every
aggregated deal is stored with its BAAI/bge-small-en-v1.5 embedding and
queryable at sub-millisecond latency via an HNSW cosine index — replacing the
in-memory numpy approach from Part 5 with a durable, live-searchable store.

---

## 2. Prerequisites

- Part 5 — Semantic search (embeddings, BM25, RRF, rerank): the embedding
  matrix and `search.py` hybrid pipeline
- Part 9 — Tiered aggregation & resilience: the live aggregator that produces
  the deal objects Part 13 will now persist
- Part 11 — The agent (ReAct, text-to-SQL, tools, HITL): SQL tooling the
  agent will extend to query pgvector
- Part 12 — Expose it as an MCP server: the MCP surface that Part 13 adds a
  `semantic_search` tool to

---

## 3. By the end, the learner can…

- Spin up Postgres with the pgvector extension locally via Docker Compose and
  run a migration that creates the `deals` table with a `vector(384)` column.
- Insert a live aggregated deal (with its embedding) using `psycopg3` and
  confirm round-trip fidelity.
- Build an HNSW cosine index (`CREATE INDEX … USING hnsw … WITH (m=16,
  ef_construction=64)`) and explain how it differs from flat exhaustive scan
  (IVFFlat) for a 270–50 000-row table.
- Run a `<=>` cosine-distance query that returns the top-5 semantically
  nearest deals to a free-text query in under 5 ms against the seeded snapshot.
- Expose `semantic_search(query, top_k)` as a new MCP tool backed by pgvector
  and compare latency + precision@5 against the Part 5 in-memory baseline.

---

## 4. Data

**Seed data:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
(270 items) — loaded once at migration time by `db/seed.py` to populate the
`deals` table. This makes Part 13 reproducible offline without calling live
APIs. Embeddings are generated from the same cached
`companions/dealfinder/data/embeddings.npy` + `ids.json` produced in Part 4/5.

**Live path (shown in final section):** after seed, the tutorial runs the Part
9 aggregator for one query ("noise cancelling headphones") and upserts the
returned live deals — demonstrating the write path on real data. Exact counts
will vary; the tutorial quotes "≥ 4 results returned by the live aggregator"
without pinning a specific live count (only the seeded 18-item subset for the
anchor query is pinned in tests).

**Infrastructure:** Postgres 16 + pgvector 0.7+ running in Docker
(`docker-compose.yml` introduced in this part). No cloud account required.
`DATABASE_URL` env var switches between local Docker and a managed instance
(Part 25).

---

## 5. Worked Example

**Setup:** seed the database from the snapshot. The `deals` table receives all
270 rows; the 18 items under query "noise cancelling headphones" are the hero
cast's home turf (snapshot median `$162.97`).

**Query:** `SELECT title, price, 1 - (embedding <=> query_vec) AS cosine_sim
FROM deals ORDER BY embedding <=> query_vec LIMIT 5;`
where `query_vec` is the bge-small-en-v1.5 embedding of "noise cancelling
headphones" (384 floats, generated inline).

**Expected top-5 (from seeded snapshot, deterministic):**
1. Sony WH-1000XM5 @ $162.97 (Costco) — cosine_sim ≈ 0.91 (sits at median)
2. Anker Soundcore Q20i @ $44.99 — cosine_sim ≈ 0.89 (honest budget deal)
3. Bose QuietComfort 45 @ $46 — cosine_sim ≈ 0.88 (the too-good-to-be-true
   trap; pgvector surfaces it by relevance — deal validation is downstream)
4. Sony WH-1000XM6 @ $399.99 — cosine_sim ≈ 0.87
5. Sony WH-1000XM5 @ $248 (Macy's) — cosine_sim ≈ 0.91 (dedup candidate;
   same embedding as Costco listing, different price — Part 1's dedup flag is
   stored in the `dedup_canonical_id` column)

The tutorial highlights: pgvector returns the Bose QC45 at $46 at rank 3 —
correct by relevance, wrong by deal score. This is not pgvector's failure;
the two-signal deal score (Part 3's model residual) filters it post-retrieval.
The `semantic_search` MCP tool returns raw cosine-ranked results; the agent
(Part 11) applies the deal guard.

**Latency benchmark (seeded, 270 rows, HNSW):** `EXPLAIN ANALYZE` shows
< 1 ms per query on a MacBook M-series; the tutorial quotes this and notes
the number grows to ~5 ms at 50 000 rows (IVFFlat diverges at that scale —
shown in a one-paragraph aside).

---

## 6. Companion Code

**NEW part — no prior step tag.** Maps to `step-13` in `tutorial-dealfinder`
repo. Delta from `step-12` (MCP server):

- `companions/dealfinder/db/` — NEW directory:
  - `schema.sql` — `CREATE EXTENSION vector; CREATE TABLE deals (...,
    embedding vector(384), dedup_canonical_id text); CREATE INDEX USING hnsw
    (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);`
  - `client.py` — `psycopg3`-backed `DealStore`: `upsert(deal, embedding)`,
    `semantic_search(query_vec, top_k) -> list[Deal]`, `close()`
  - `seed.py` — loads snapshot JSON + cached embeddings.npy, bulk-inserts via
    `executemany`, idempotent (ON CONFLICT DO UPDATE)
- `docker-compose.yml` — `pgvector/pgvector:pg16` image, port 5432, volume
  for data persistence; `POSTGRES_PASSWORD` from `.env`
- `companions/dealfinder/mcp_server.py` — EXTENDED: add
  `semantic_search(query: str, top_k: int = 5)` tool that calls
  `DealStore.semantic_search`
- `tests/test_db.py` — NEW: asserts round-trip upsert + top-5 for hero cast
  query (runs against a test DB spun up by pytest fixture)
- `requirements.txt` — add `psycopg[binary]>=3.1`, `pgvector>=0.3`

---

## 7. Animations

**Animation 1 — NEW: `VectorIndex`**
Visual metaphor: a 2D projection of the 270-item embedding space rendered as a
scatter of dots (positions are the first two PCA dimensions, computed from the
seeded embeddings and hardcoded as static props). The HNSW graph edges are
drawn as faint lines between each node and its `m=16` nearest neighbours.
When the learner hovers "noise cancelling headphones", a query point appears
and the HNSW traversal path animates (highlighted edges, candidate nodes
turning gold, eliminated nodes fading) until the top-5 settle. Hero cast dots
are labeled (XM5, Q20i, QC45, XM6). Framer Motion: staggered dot entry, path
animation on hover trigger. Distinct shape: the graph traversal path is unique
— no other component shows node-edge navigation.

**Animation 2 — REUSE `HybridFusion`**, re-themed: replace the BM25/dense
lanes with "In-memory numpy (Part 5)" vs "pgvector HNSW (Part 13)". Show
identical top-5 results converging from both lanes, then surface the latency
difference (numpy: O(N) scan label; pgvector: O(log N) label). This concisely
communicates the migration benefit without a new shape.

---

## 8. Teaching Beats

1. **Concept — why persist embeddings:** In-memory numpy (Part 5) resets on
   restart and can't be shared across processes or API replicas. A vector DB
   gives durability + concurrent access.
2. **Infra — Docker Compose + pgvector:** `docker compose up -d`; run
   `psql -c "SELECT pgvector_version();"` to confirm extension loaded.
3. **Code — schema.sql:** Walk through each column; explain `vector(384)`
   type; explain why HNSW beats IVFFlat for a table that grows incrementally
   (IVFFlat needs a full rebuild on insert; HNSW inserts incrementally).
4. **Code — DealStore.upsert:** Show the `psycopg3` `execute` call with the
   pgvector Python adapter's `register_vector` helper. Insert the XM5 Costco
   listing as a single-item demo.
5. **Code — seed.py:** Bulk-insert all 270 items; show `\timing` before/after
   the HNSW index creation.
6. **Proof — semantic query:** Run the worked example SQL; show the top-5
   printed with cosine_sim values. Highlight that cosine_sim ≈ 0.88 for the
   Bose QC45 — high relevance, bad deal — and point to Part 3's guard.
7. **Concept — HNSW parameters:** m=16 controls graph connectivity (recall vs.
   build time); ef_construction=64 controls build-time search depth. Show a
   two-row table: (m=8, ef=32) recall@10 vs (m=16, ef=64) recall@10 on the
   snapshot (values from test run, hardcoded).
8. **Code — MCP tool extension:** Add `semantic_search` to the MCP server from
   Part 12; show the tool descriptor and the `DealStore` call.
9. **Proof — latency comparison:** `timeit` the Part 5 numpy dot product vs.
   the pgvector query over 270 rows; show pgvector wins at 10 000+ rows
   (extrapolated in a one-paragraph note; not a live benchmark at that scale).

---

## 9. Cross-References

**Back (Part 12 — Expose it as an MCP server):** Part 12 built the MCP server
surface with tools backed by the in-memory search index from Part 5; Part 13
upgrades the backing store to pgvector and adds `semantic_search` as a new
first-class MCP tool — the agent and any MCP client immediately benefit without
changing their call sites.

**Forward (Part 14 — The web app: search UI, live/semantic toggle, SSE):**
Part 14 builds the browser-facing search UI and wires the live/semantic toggle
directly to the pgvector `semantic_search` endpoint introduced here; the
database seeded in Part 13 is the data source the UI queries in real time.

---

## 10. Reproducibility Checks

All asserts run against a pytest-managed local Postgres in `tests/test_db.py`
(step-13). The fixture spins up via `docker compose` or a `testing.postgresql`
in-process instance; teardown drops the schema.

```python
# Round-trip: upsert XM5 Costco + retrieve by id
store.upsert(xm5_costco_deal, xm5_embedding)
retrieved = store.get_by_id("xm5-costco-162")
assert retrieved.price == 162.97
assert retrieved.title == "Sony WH-1000XM5"  # exact title from snapshot

# Semantic top-5 for "noise cancelling headphones" must include all hero cast
results = store.semantic_search(query_vec_nchs, top_k=5)
result_ids = {r.id for r in results}
assert {"xm5-costco-162", "anker-q20i-44", "bose-qc45-46"}.issubset(result_ids)

# Cosine sim of XM5 Costco must be >= 0.88
xm5_result = next(r for r in results if r.id == "xm5-costco-162")
assert xm5_result.cosine_sim >= 0.88

# HNSW index exists
cur.execute("SELECT indexname FROM pg_indexes WHERE indexname = 'deals_embedding_hnsw_idx';")
assert cur.fetchone() is not None
```

Snapshot item ids in the asserts must match the actual `id` values in
`electronics-2026-07.json` — the authoring agent must verify these before
writing tutorial prose.

---

## 11. Risks / Notes

- **Docker required:** pgvector runs in Docker; learners without Docker Desktop
  can use the `pgvector/pgvector` image on GitHub Codespaces (free tier
  sufficient). The tutorial opens with a one-paragraph Docker check
  (`docker --version`) and a Codespaces alternative callout.
- **pgvector version pinning:** `vector(384)` HNSW requires pgvector ≥ 0.5.
  The Docker image tag is pinned to `pgvector/pgvector:0.7.0-pg16` in
  `docker-compose.yml` to avoid surprises on newer breaking releases.
- **Port conflict:** 5432 may be taken by a local Postgres. The compose file
  maps to `5433:5432` on the host by default; `DATABASE_URL` defaults to port
  5433. Document this in the tutorial and in `.env.example`.
- **psycopg3 + pgvector adapter:** `register_vector(conn)` must be called
  before any vector read/write. A missing call produces a cryptic
  `can't adapt type 'numpy.ndarray'` error. The tutorial shows the call site
  explicitly and includes it in the `DealStore.__init__` so learners can't miss
  it.
- **Non-determinism in cosine_sim values:** pgvector HNSW is approximate;
  exact cosine_sim digits may vary by platform. Tests assert `>= threshold`
  not exact equality. The tutorial notes this and explains that HNSW trades
  a tiny recall fraction (< 0.5% at these table sizes) for speed.
- **No GPU, no cloud cost:** all compute is local CPU + Docker. The managed
  Postgres path (Part 25) is mentioned in a forward-reference callout but not
  exercised here.
