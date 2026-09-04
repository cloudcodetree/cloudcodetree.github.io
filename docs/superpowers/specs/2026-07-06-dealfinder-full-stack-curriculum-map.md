# DealFinder — Full-Stack ML/AI/Data Engineer Curriculum Map

**Date:** 2026-07-06
**Goal:** one project (DealFinder) that takes a learner from AI-assisted dev to a
**full-fledged full-stack ML / AI / data engineer** — benchmarked against the paid
programs (DeepLearning.AI ML/DL/GenAI/MLOps, Duke MLOps, Made With ML, Chip Huyen's
*AI Engineering* & *Designing ML Systems*).

**Shape:** two tracks. **Track 1 — Foundations** teaches each concept on a *clean,
offline, deterministic* synthetic sandbox (great pedagogy, testable). **Track 2 —
Build the Real Full-Stack AI SaaS** productionizes DealFinder into a live,
multi-source, deployed SaaS and closes the ML-rigor + full-stack gaps the benchmark
surfaced.

Effort tags: **[written]** already published · **[built→write]** code exists (steps
30–38), needs a tutorial · **[build+write]** new module to build and write.

---

## Track 1 — Foundations (Parts 1–15, existing) [written]

Clean synthetic sandbox; concept-first; offline-testable. Keep as-is, lightly
re-aim data/search/serve parts to foreshadow the real versions.

| # | Part | Pillar |
|---|---|---|
| 1 | Data layer & the DealSource interface | data eng |
| 2 | How LLMs actually work (literacy) | deep learning / LLM |
| 3 | "Is it a good deal?" price model (from scratch) | classic ML |
| 4 | Recommender (content + collaborative) | classic ML |
| 5 | Semantic search (embeddings, BM25, RRF, rerank) | LLM / retrieval |
| 6 | Structured extraction (schema-validated LLM output) | LLM |
| 7 | QLoRA fine-tuning (anchored) | LLM / fine-tuning |
| 8 | The agent (ReAct, tools, text-to-SQL, HITL) | LLM / agents |
| 9 | MCP server | LLM / integration |
| 10 | Safety, security & governance | security |
| 11 | Evaluation harness (golden set, A/B, CI gate) | MLOps / eval |
| 12 | Serve efficiently (FastAPI, cache, batching) | infra / serving |
| 13 | Containerize & deploy (Docker, CI/CD, IaC) | infra |
| 14 | Observability, cost & ops (drift/PSI, FinOps) | MLOps |
| 15 | Ship & get hired (case study, system design) | product |

---

## Track 2 — Build the Real Full-Stack AI SaaS (Parts 16–33)

### Phase 5 — Real data & aggregation (mostly built; document)
- **16. Real DealSource connectors** — live official APIs (eBay Browse, RapidAPI,
  Best Buy), OAuth, affiliate URLs. `[built→write]` *(steps 36, 38)* · data eng
- **17. Scraping responsibly** — Apify managed actors, Shopify `/products.json`,
  Firecrawl; robots.txt / ToS / blocking realities; when to use an API vs a
  scraper. `[built→write]` *(steps 30, 33, 37)* · data eng
- **18. Tiered aggregation & resilience** — cost/rate-limit tiers, early-stop,
  circuit breakers (anti-throttle), cross-source dedup, value ranking (% below
  live median). `[built→write]` *(step 34)* · data eng / systems

### Phase 6 — Data engineering that scales *(closes gaps: dataset eng, data-at-scale)*
- **19. Dataset engineering** — sampling, labeling (natural vs hand), class
  imbalance, augmentation, leakage & temporal splits; build a labeled "good deal"
  dataset from real listings. `[build+write]` · data eng — **GAP #3**
- **20. Pipelines & orchestration** — Prefect/Airflow for ingestion + the
  suggestions job, batch vs streaming, a warehouse + dbt model, data
  validation/contracts (Great Expectations). `[build+write]` · data eng — **GAP #5**

### Phase 7 — ML rigor & MLOps *(closes gaps: breadth, tracking, eval, the loop)*
- **21. ML & DL breadth** — gradient-boosted trees (XGBoost) for the deal model, a
  **time-series price-drop forecaster** (real DealFinder feature), and one PyTorch
  training loop. `[build+write]` · classic ML / DL — **GAP #7**
- **22. Experiment tracking & model registry** — MLflow/W&B: track price/recsys
  models, params, metrics; register + version the winner. `[build+write]` · MLOps —
  **GAP #2 (universal must-have)**
- **23. Evaluation as a discipline** — golden sets, LLM-as-judge, ranking metrics &
  benchmarks, eval-driven development, and **structured error analysis**.
  `[build+write]` · MLOps / eval — **GAP #1 (Huyen gives it 2 chapters)**
- **24. Closing the MLOps loop** — drift → automated retrain → eval gate →
  champion/challenger → canary/promote. `[build+write]` · MLOps — **GAP #4**

### Phase 8 — Serving, cloud & production ops
- **25. Inference optimization, for real** — quantization, batching/vLLM, semantic
  caching, model routing/cascades; **benchmarked**. `[build+write]` (partial: cache,
  LLM tiering) · infra — **GAP #8**
- **26. Cloud & Kubernetes** — real cloud via Terraform (managed Postgres, a
  container service, object storage/R2), K8s basics, **secrets management**
  (Vault/cloud secrets) — beyond local Docker. `[build+write]` (partial: local TF) ·
  cloud/infra
- **27. Observability & FinOps, for real** — OpenTelemetry/Langfuse tracing,
  Prometheus/Grafana, live cost dashboards + budget alerts on real API/LLM spend,
  load testing. `[build+write]` (partial: PSI, cost concept) · MLOps/ops

### Phase 9 — Full-stack SaaS *(the differentiator most ML courses skip)*
- **28. The web app, for real** — React/Next front end: components, state,
  responsive, a11y, **SSE streaming** of LLM output + live results. `[build+write]` ·
  full-stack — **GAP (full-stack web)**
- **29. Auth & accounts** — Supabase Auth (JWT/OAuth/sessions), RBAC, protecting the
  API. `[build+write]` · full-stack / security
- **30. Saved searches & the periodic-suggestions worker** — the scheduled
  "things you'll like" job (orchestration + recsys + SendGrid notifications).
  `[build+write]` · full-stack / data eng
- **31. Payments & SaaS mechanics** — Stripe billing/tiers/webhooks, usage metering,
  plan gating. `[build+write]` · full-stack / product
- **32. Security & compliance at scale** — OWASP-LLM, dependency/secret scanning,
  PII/GDPR, rate-limiting/abuse, audit. `[build+write]` · security

### Phase 10 — Ship
- **33. Ship & operate the real system** — e2e tests (Playwright), load/chaos, a
  production runbook, and the case study + **system-design interview on the real,
  deployed SaaS** (evolves Part 15). `[build+write]` · product / testing

---

## Pillar coverage after expansion (all 8 green)

| Pillar | Parts |
|---|---|
| Data engineering | 1, 16–18, 19, 20 |
| Classic ML | 3, 4, 21 |
| Deep learning | 2, 21 (PyTorch loop) |
| LLM / GenAI / AI-eng | 5, 6, 7, 8, 9, 23, 25 |
| MLOps | 11, 14, 22, 23, 24 |
| Cloud / infra / platform | 12, 13, 26, 27 |
| Full-stack web / product | 28, 29, 30, 31 |
| Security / testing | 10, 32, 33 |

## Sequencing & modularity

Natural exit points so learners can stop at a coherent milestone:
- **After Part 8** — "I can build AI features."
- **After Part 15** — "I understand the full concept stack" (Foundations complete).
- **After Phase 7 (Part 24)** — "I'm a real ML/MLOps engineer."
- **After Phase 9 (Part 32)** — "I built and can operate a full-stack AI SaaS."
- **Part 33** — "hired."

## What this deliberately keeps

- The **clean synthetic sandbox** for Track 1 (offline, deterministic, testable) —
  don't sacrifice teachability by forcing every early lesson onto live APIs.
- The **bespoke concept animations** throughout.
- The **single companion repo** with git-tag-per-step; Track 2 continues the tags
  (steps 30–38 are already the first real ones).
- The **publish gate**: nothing ships until the user has personally worked through it.
