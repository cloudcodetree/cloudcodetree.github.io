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

---

## 9. Pinned hero-cast facts & cross-cutting conventions (AUTHORITATIVE)

Every part MUST cite these values. **This table overrides any conflicting number
in a part-spec.** No part may invent a hero-cast number. All values are computed
by the re-spined companion against the committed snapshot and pinned in
`tests/test_dealscore.py`.

### 9.1 Hero-cast facts table
Anchor query **"noise cancelling headphones"**, snapshot median **$162.97**,
headphones subset size **15** items. Price model = the from-scratch linear
baseline fit on the **audio** category (Part 17 upgrades it to gradient boosting;
the *numbers below are the pinned baseline* and any GBDT part must re-pin from a
committed test, not invent).

| Item | actual | model fair price | residual ($ = fair−actual) | residual_frac | median_signal | verdict |
|---|---|---|---|---|---|---|
| Sony WH-1000XM5 | $162.97 | $285.15 | +$122.18 | +0.428 | +0.000 | **fair** |
| Anker Soundcore Q20i | $44.99 | $108.33 | +$63.34 | +0.585 | +0.724 | **deal** |
| Bose QuietComfort 45 | $46.00 | $285.15 | +$239.15 | +0.839 | +0.718 | **suspicious** |
| Sony WH-1000XM6 | $399.99 | $285.15 | −$114.84 | −0.403 | −1.454 | overpriced |

Note the teaching crux: Bose and XM5 share the **same $285.15 fair price** (both
tier-4 flagships → identical features), which is *why* Bose-at-$46 reads as the
trap. Anker and Bose are both ~72% under median at ~$45; **only the residual
(0.585 vs 0.839) separates them.**

### 9.2 Residual sign convention (define once, use everywhere)
`residual = predicted_fair − actual`; `residual_frac = residual / predicted_fair`.
**Large POSITIVE residual = suspiciously cheap.** A listing is **suspicious** when
`median_signal ≥ 0.70` AND `residual_frac > 0.70`. Parts 12 & 14 (which inverted
the sign) MUST conform. There is no dollar-residual with a negative "trap" sign.

### 9.3 Condition
The Bose QC45 title has **no condition token → `condition = "new"` (default)**.
The trap is caught by the **model residual, never by a parsed condition flag.**
No part may assert `condition="refurb"` for the Bose (fixes Parts 16/17/20).

### 9.4 Evaluation golden set & the one eval-gate metric
Golden set = **20 hand-labeled items** drawn from the snapshot (all 15 headphones
+ 5 cross-category), each labeled `deal|fair|suspicious|overpriced`. Golden-set
sizes are always **subsets of the snapshot** (a 54-item headphones golden set is
impossible — the subset is 15). **The eval gate is `precision@5 ≥ 0.80` on the
golden set** — used identically in Parts 19, 20, 24, 32. No other k/threshold.

### 9.5 Embeddings (one model, clear provenance)
One embedding model course-wide: **fastembed `BAAI/bge-small-en-v1.5` (384-dim)**,
including Part 22's query path + semantic cache (NOT OpenAI — reproducibility).
Provenance: **Part 4 introduces + caches** title embeddings; **Part 5 reuses**
them; **Part 13 persists** them in pgvector. Any quoted cosine similarity comes
from one committed embedding run and is test-pinned; Parts 5 and 13 use the same run.

### 9.6 Dedup lineage & threshold
`canonical_id` = normalized `title_brand + model` key, introduced in **Part 1**.
**Part 1** = `dedup_by_normalized_title` (exact/normalized key). **Part 9** =
`dedup_by_embedding` (cross-source near-duplicates). One dedup **cosine threshold
= 0.90 course-wide** (Parts 9/33). The Sony WH-1000XM5 at $162.97 (Costco) and
$248 (Macy's) is the canonical dedup example.

### 9.7 Badge taxonomy (drives UI + Playwright selectors)
Exactly four badges, mapping 1:1 to verdict labels: **`DEAL`** (green) ·
**`FAIR`** (neutral) · **`SUSPICIOUS`** (amber warning) · **`OVERPRICED`** (grey).
No synonyms ("Genuine deal"/"Verify condition"/"no Deal badge" are banned).
Parts 14/27/32/33 use these exact tokens.

### 9.8 Safety split (Part 21 vs Part 31)
**Part 21** owns single-request model-surface hardening as reusable modules
(injection detection, `PIIScrubber`, output validation, model card, OWASP-LLM
map). **Part 31 IMPORTS and EXTENDS** them for multi-tenant/at-scale (GDPR
data-subject requests, sliding-window rate limiting, abuse detection, audit at
scale). Part 31 re-implements nothing; both specs state this explicitly.

### 9.9 Snapshot provenance & minor pins
The snapshot came from **RapidAPI + Apify** (real Google Shopping); state it
consistently (Parts 1/8). The messiness catalogue is retailer-as-brand pollution
(154/270) and median-signal outliers — **no "price-in-brand leak"** (drop Part
10's invented `brand="46"`). Part 27 animation is **`SearchStateMachine`** (no
Cyrillic). Frontend batch counts must match their Playwright fixtures.
