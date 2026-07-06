# DealFinder Course Regeneration — Spec & Course Bible

**Date:** 2026-07-06
**Status:** Approved design; supersedes the data/domain assumptions of
`2026-07-06-dealfinder-full-stack-curriculum-map.md` (that map kept a *synthetic
sandbox* for Track 1 — this spec overrides that: the course is now **real data
from Part 1**).

This is both the **spec** for regenerating the DealFinder course and the
**course bible** — the frozen decisions every downstream authoring agent MUST
obey so 33 independently-written parts read as one coherent course.

---

## 1. Locked decisions (do not relitigate downstream)

1. **Real data from Part 1.** No synthetic catalog, no fictional tents. Every
   dataset is real electronics listings.
2. **Broad consumer electronics**, not one narrow category. The live aggregator
   takes any query; the ML parts teach on the real heterogeneous corpus and
   confront its messiness head-on.
3. **Versioned real-data snapshot for reproducibility.** One committed, dated
   corpus powers training / tests / eval / quoted numbers. The **live
   aggregator still runs live** in the parts that are *about* liveness.
4. **One 33-part plan**, built brainstorm → spec → plan → build.
5. **Publish gate.** Nothing ships until the user has personally walked the
   part. Course work: parent repo branch `draft/dealfinder`; companion submodule
   branch `draft/electronics-regen` (keep submodule `main` pristine).

---

## 2. Data architecture — the snapshot/live split

| Concern | Source | Why |
|---|---|---|
| Train a price model / recommender | **Frozen snapshot** | needs stable labels + reproducible R²/MAE |
| Unit tests, CI eval gate, golden sets | **Frozen snapshot** + mocked HTTP | deterministic, offline |
| Every quoted number / example in prose | **Frozen snapshot** | the prose must not lie when a learner runs it |
| Live multi-source aggregation, circuit breaker | **Live APIs** | the lesson *is* liveness/resilience |
| Web UI live search, semantic search over fresh deals | **Live APIs** | show the real product working |

**The snapshot:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
— 270 real items, 18 queries, 11 categories, pulled from the live aggregator
(RapidAPI + Apify = real Google Shopping); eBay excluded (sandbox test data in
this environment). Regenerate via `data/build_snapshot.py` against a running app.
Snapshot item shape: `id, query, category, title, brand, price, currency,
source, marketplace, url, image_url, deal_pct, median_price_at_capture`.

**Real-world messiness captured on purpose (this is the curriculum):**
- `brand` holds the **retailer**, not the manufacturer, in 154/270 rows
  ("Walmart - COWIN", "Target", "mountainlifestyle.ca"). → true brand must be
  extracted from the *title*. Teaches normalization (Part 1) + extraction (Part 6).
- The **naive median deal-signal is fooled**: a "$10.75 Kindle Paperwhite" reads
  91.7% under median (it's an accessory/mislisting), and `deal_pct` bottoms at
  −3785% on a mispriced outlier. → motivates the price model, category-aware
  median, outlier guarding (Part 3), and dedup (Part 1/8).

---

## 3. The recurring hero cast (the new `tent-03`)

Anchor query: **"noise cancelling headphones"** (snapshot median **$162.97**).
These exact real items recur across parts so the course feels unified:

| Item | Price | Role in the narrative |
|---|---|---|
| **Sony WH-1000XM5** | **$162.97** (Costco) | The *fair-price flagship anchor* — sits at the median. Also appears at **$248 (Macy's)** → the **dedup** lesson (same product, two prices, keep cheapest). |
| **Anker Soundcore Q20i** | **$44.99** | The *honest budget deal* — 72% under median and genuinely a real value pick. The "true positive." |
| **Bose QuietComfort 45** | **$46** | The *too-good-to-be-true trap* — median says "72% off!"; a $329-MSRP flagship at $46 is refurb/mislisted. The "false positive" that motivates the price model + brand/condition awareness. |
| **Sony WH-1000XM6** | **$399.99** | Premium anchor (top of range). |

Use this cast for worked examples wherever a concrete listing is needed. Prefer
these to inventing new items, so cross-part references land.

---

## 4. Feature representation & deal-score definition (broad electronics)

**Features** (shared vector spanning heterogeneous categories):
- `category` (one-hot / target-encoded: audio, computers, displays, peripherals,
  storage, accessories, mobile, wearables, smart-home, components, misc)
- `brand_tier` (ranked, derived from the **title-extracted** manufacturer, not
  the raw `brand` field)
- `condition` (new / refurb / used — ordinal; parsed from title)
- `title embedding` (fastembed `BAAI/bge-small-en-v1.5`, 384-dim — already in the
  repo) — carries the signal that hand-features can't for broad data
- optional sparse numeric extractions where present (storage GB, screen size)

**Deal score = two signals, blended:**
1. **Cross-source live median** (primary, already in `aggregate.py`): % below the
   median price for the *same query*. Fast, model-free, but noisy (see §2).
2. **Model residual** (guard): predicted fair price − actual, from a
   gradient-boosted model on the features above. Catches the Bose-QC45-at-$46
   false positive that the median alone rewards.

This is the through-line: Part 3 shows the naive linear model *fails* on broad
data → §4's categorical+embedding representation + gradient boosting is the
answer (pulled forward from the old "Part 21", now motivated, not bolted on).

---

## 5. Shared MDX part template (voice + structure contract)

Every part MUST follow this shape (matches the existing published style):

1. **Frontmatter-free MDX** at `app/tutorials/(article)/dealfinder-<slug>/page.mdx`;
   list metadata in `app/tutorials/manifest.ts`.
2. **Course summary + clickable TOC** at the very top (matches current site
   convention — see recent commits).
3. **TL;DR** (2–3 sentences: what you'll build + why it matters).
4. **"What you'll be able to do"** — concrete capability bullets.
5. **Body**: concept → code → *worked example using the hero cast / snapshot* →
   what it proves. Interleave **bespoke animations** (see §6).
6. **Companion repo callout**: the `tutorial-dealfinder` step tag(s) + a compare
   URL for the diff.
7. **Forward/back references** to neighboring parts by number+title (this is what
   makes the arc cohere — every part names where it came from and where it leads).

**Voice:** second person, direct, no hype, no emoji. Numbers are real and quoted
from the snapshot/repo (never invented). Every "run this and you'll see X" MUST
reproduce against the frozen snapshot or the running app. Prefer the hero cast.

**Reproducibility contract:** if a part quotes a metric (R², MAE, precision@k,
median, deal_pct), that number must come from code run against the committed
snapshot, and a test must pin it.

---

## 6. Animations

Reuse the existing 34 bespoke components (`app/components/mdx/*`, registered in
`mdx-components.tsx`) — re-theme their example data to electronics where they
carry tent data. **New concepts get new bespoke components** (one distinct visual
metaphor per concept — never reuse a shape to fill space). New parts (real
sources, tiered aggregation, circuit breaker, pgvector, Terraform, web UI,
experiment tracking, MLOps loop, inference opt, full-stack SaaS) each need
purpose-built animations. Budget ~2 per part; all must be static-export-safe
(real text in the DOM, Framer Motion, no runtime data fetch).

---

## 7. The 33-part map

Legend — **Data:** `SNAP` (frozen snapshot) · `LIVE` (live APIs) · `CONCEPT`
(browser/illustrative) · `INFRA`. **Code:** companion step tags.

### Phase 1 — Real data & the aggregator (the differentiator, now first-class)
| # | Part | Data | Notes vs old course |
|---|---|---|---|
| 1 | Data layer, normalization & the snapshot | SNAP+LIVE | build connectors + **freeze the snapshot**; extract true brand from title |
| 2 | How LLMs actually work (literacy) | CONCEPT | re-theme examples to electronics |
| 3 | "Is it a good deal?" — median vs. model | SNAP | naive linear model *fails* on broad data → §4 two-signal score |
| 4 | Recommender (content + collaborative) | SNAP | content sim over real title embeddings |
| 5 | Semantic search (embeddings, BM25, RRF, rerank) | SNAP | already real embeddings |
| 6 | Structured extraction (messy titles → schema) | SNAP+LLM | real retailer-polluted titles |
| 7 | Live multi-source connectors (real APIs, OAuth, affiliate) | LIVE | **new** — steps 30/36/38 |
| 8 | Scraping responsibly (Apify/Shopify/Firecrawl; ToS/robots) | LIVE | **new** — steps 33/37 |
| 9 | Tiered aggregation & resilience (early-stop, circuit breaker, dedup) | LIVE | **new** — step 34 |

### Phase 2 — Intelligence layer
| # | Part | Data |
|---|---|---|
| 10 | Fine-tune the extractor with QLoRA (anchored) | CONCEPT |
| 11 | The agent (ReAct, text-to-SQL, tools, HITL) | SNAP |
| 12 | Expose it as an MCP server | SNAP |
| 13 | pgvector persistence + semantic search over live deals | LIVE+INFRA | **new** — step 31 |
| 14 | The web app (search UI, live/semantic toggle, SSE) | LIVE | **new** — step 30 |

### Phase 3 — Data engineering that scales
| # | Part | Data |
|---|---|---|
| 15 | Dataset engineering (sampling, labeling, leakage, temporal splits) | SNAP | GAP #3 |
| 16 | Pipelines & orchestration (Prefect, batch/stream, dbt, contracts) | INFRA | GAP #5 |

### Phase 4 — ML rigor & MLOps
| # | Part | Data |
|---|---|---|
| 17 | ML & DL breadth (gradient boosting + price-drop forecaster + a PyTorch loop) | SNAP | GAP #7 |
| 18 | Experiment tracking & model registry (MLflow) | SNAP | GAP #2 |
| 19 | Evaluation as a discipline (golden sets, LLM-judge, error analysis) | SNAP | GAP #1 |
| 20 | Closing the MLOps loop (drift → retrain → eval gate → canary) | SNAP+INFRA | GAP #4 |

### Phase 5 — Safety, serving, cloud & ops
| # | Part | Data |
|---|---|---|
| 21 | Safety, security & governance (injection, PII, model card) | SNAP | |
| 22 | Serve it fast & cheap (FastAPI, semantic cache, batching) | LIVE | |
| 23 | Inference optimization, for real (quant, vLLM, routing; benchmarked) | INFRA | GAP #8 |
| 24 | Containerize & ship (Docker, CI/CD, IaC/Terraform) | INFRA | steps 28/32 |
| 25 | Cloud & Kubernetes (managed Postgres, secrets mgmt) | INFRA | |
| 26 | Observability & FinOps, for real (Langfuse/Grafana, live cost, load test) | INFRA | |

### Phase 6 — Full-stack SaaS (the differentiator most ML courses skip)
| # | Part | Data |
|---|---|---|
| 27 | Front end for real (React/Next, state, a11y, SSE streaming) | LIVE |
| 28 | Auth & accounts (Supabase Auth, RBAC) | LIVE |
| 29 | Saved searches & the periodic-suggestions worker | LIVE |
| 30 | Payments & SaaS mechanics (Stripe, metering, plan gating) | LIVE |
| 31 | Security & compliance at scale (OWASP-LLM, PII/GDPR, abuse) | — |

### Phase 7 — Ship
| # | Part | Data |
|---|---|---|
| 32 | Ship & operate (Playwright e2e, load/chaos, runbook) | — |
| 33 | Case study + system-design interview on the real, deployed SaaS | — |

---

## 8. Build sequencing (how the plan will run)

- **Phase 0 (done/in-progress, sequential):** freeze snapshot ✅ · this bible ·
  re-spine companion core (snapshot loader, §4 features, two-signal deal score).
- **Phase 1 (Workflow, fan-out):** one agent per part reads this bible → emits a
  tight part-spec (objective, code deltas/step tags, snapshot examples, animation
  briefs). Completeness critic.
- **Phase 2 (Workflow, pipeline):** per part: write MDX → build animations →
  verify it reproduces against snapshot/repo. Companion code progresses as an
  ordered lane (tests stay green).
- **Phase 3 (Workflow, adversarial):** per part, two lenses — reproducibility
  (every quoted command/number runs) and arc-consistency (voice, cross-refs, no
  contradictions/redundancy) — plus a `frontend-reviewer` static-export/a11y pass.

Nothing ships until the user walks it.
