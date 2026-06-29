# DealFinder — AI Engineering, End to End (capstone series)

- **Date:** 2026-06-29
- **Status:** Approved design, ready for implementation planning
- **Type:** New tutorials series (capstone) for cloudcodetree.com/tutorials

## Summary

A hands-on **capstone series** that takes a competent software engineer who is new
to the AI side and walks them, one shippable phase at a time, through building
**DealFinder** — a real, deployed, evaluated AI product — while learning the full
stack of skills employers screen for in 2026 (AI Engineer *and* ML Engineer).

It is **one product, built incrementally** across 15 parts grouped into 5 phases.
Each phase is itself a portfolio-worthy milestone. The end state is a multi-surface,
production-shaped system the learner can deploy, demo, and put on a résumé — the
"I shipped a real, evaluated AI system" proof the market rewards over certificates.

## Audience & prerequisites

- **For:** working software engineers, **new to AI engineering**. Comfortable with
  Python and git; little/no prior ML, RAG, or LLM-ops experience.
- **Not for:** absolute programming beginners. Point those readers to the existing
  **RAG from Scratch** track first.
- **Self-contained-but-linked:** each part teaches what it needs and links out to the
  deeper standalone tutorials (RAG from Scratch, Fine-Tuning & Serving) rather than
  re-teaching from zero.

## Why this product

The deal-finder is the spine because it gives every screened skill a *natural* home
and makes the usually-hard-to-teach skills concrete:

- Real **messy data** (products/prices) → data engineering, the connector pattern.
- A genuine **classic-ML** need → a price/"is it a good deal?" model and a recommender.
- Obvious **retrieval** need → embeddings, vector DB, hybrid search, reranking by value.
- A reason to **fine-tune** → structured extraction from messy listings + house voice.
- A real **agent** → plan → search → score → rank → explain, with tools + memory + HITL.
- Intrinsic **drift** (prices change daily) → makes monitoring + scheduled retraining intuitive.
- Real **cost** across LLM + infra → FinOps / budgets / cost attribution.

## The product: DealFinder

Search the best deals on an item; get periodic personalized "you might like" suggestions;
watch items for genuine price drops.

### Surfaces (4)

1. **Web app** — natural-language search; ranked results with a deal badge ("↓23% vs
   typical · genuine deal"), specs, and a one-line "why"; left rail filters + "your taste";
   right rail agent trace, deal-score breakdown, suggestions; footer latency/cost/eval metrics.
   *Light, professional theme (validated in brainstorming, v3).*
2. **API + CLI** — every web action is a REST endpoint (`/v1/search` streams,
   `/v1/deals/{id}`, `/v1/watch`, `/v1/recommendations`, `/healthz·/metrics`) plus a
   `deal` CLI. API-first; UI second.
3. **MCP server** — the toolchain exposed as MCP tools (`search_deals`, `is_good_deal`,
   `recommend`, `price_history`) usable from Claude Code / Claude Desktop / any agent.
4. **Ops · Cost & Usage dashboard** — budgets + alerts; spend by component (vLLM,
   embeddings, vector DB, live-API, scraping, hosting); cost/query, tokens, GPU hours,
   cache savings; drift-retrain cost. (AI FinOps.)

### Architecture (end state)

```
   SURFACES:   Web app      API + CLI      MCP server      Ops/Cost dashboard
                   \            |              /                  |
                 ┌─────────────────────────────────┐             │
                 │   Agent (LangGraph)              │  plan→search→score→rank→explain
                 │   memory · HITL · guardrails     │             │
                 └───────────────┬─────────────────┘             │
     ┌──────────────┬────────────┼────────────┬──────────────┐   │
 Hybrid search  Deal-scorer   Recommender  Price-history  Text-to-SQL
 BM25+vec+rerank  (ML model)    (ML model)     tool          (NL→DB)
     └──────────────┴────────────┴────────────┴──────────────┘   │
                                 │                                 │
                   Data store: Postgres + pgvector                 │
                                 ▲ normalize · dedup · version     │
              ┌──────────────────┼──────────────────┐             │
        Dataset conn.       Live-API conn.      Scraper conn.   ←  DealSource interface
                                                                   │
   LLM layer:  QLoRA fine-tuned extractor/pitch  →  vLLM (quantized) + semantic cache
   Cross-cutting:  evals in CI · Langfuse tracing · experiment tracking + model registry ·
                   drift monitor → orchestrated retrain (Airflow/Prefect) · cost metering ──┘
```

## Data design

A pluggable **`DealSource`** interface normalizes any source into one product/price
schema. Three implementations, introduced progressively:

- **Public dataset** — the reproducible spine; every learner gets identical, legal data
  the ML models train on; tutorial output is deterministic.
- **Live API** — an optional, key-gated connector (eBay / Best Buy / Keepa price history).
- **Scraper** — the "production reality" connector, taught with legal / robots.txt /
  anti-bot caveats; not the spine.

The connector/adapter pattern (schema normalization, dedup, missing-field handling, data
versioning) is itself a hireable data-engineering skill.

## Curriculum — 15 parts, 5 phases

Each phase is a standalone milestone. Type: **verified** (CPU, tested locally) or
**anchored** (GPU notebook; concept + linked maintained notebook, no "tested locally" claim).

### Phase 1 — Foundations & data
1. **Data layer & connectors** — `DealSource` (dataset+API+scraper), one schema, dedup,
   EDA; *data versioning (DVC)*. — *data engineering* — verified
2. **How LLMs actually work** — tokenization, embeddings, attention, sampling, KV cache,
   cost/latency intuition. — *LLM literacy* — anchored/conceptual

### Phase 2 — The ML brains
3. **"Is it a good deal?" price model** — features, train from scratch, evaluate, the math;
   *experiment tracking (MLflow/W&B) + model registry*. — *supervised ML* — verified
4. **Recommender** — content + collaborative; offline metrics (precision@k/NDCG). — *recsys* — verified

### Phase 3 — Retrieval & the LLM layer
5. **Semantic search + hybrid + rerank by value** — embeddings, pgvector, BM25+RRF,
   structured filters. — *retrieval* — verified
6. **LLM structured extraction** — messy listing → JSON specs; prompt patterns; model
   selection + cost. — *prompt/structured output* — verified
7. **QLoRA fine-tune** — extraction/voice; eval vs base; DPO note; tracked + registered. —
   *fine-tuning* — anchored (GPU)

### Phase 4 — The agent & its interfaces
8. **The agent** — LangGraph, ReAct/plan-execute, tools, memory, HITL; *text-to-SQL tool*. —
   *agents/orchestration* — verified
9. **Expose it as an MCP server** — tools/resources/prompts; use from Claude Code. —
   *MCP* — verified
10. **Safety, security & governance** — prompt injection, output validation, PII/privacy,
    bias/fairness checks, audit log, a model card. — *responsible AI* — verified

### Phase 5 — Prove it, ship it, run it
11. **Evaluation harness** — golden sets, LLM-as-judge/RAGAS, rec metrics, A/B, in CI. —
    *evaluation* — verified
12. **Serve efficiently** — FastAPI + streaming + web UI; quantization/batching/vLLM;
    *semantic caching*; the periodic suggestions job. — *serving / inference opt* — verified
13. **Containerize & deploy** — Docker, IaC (Terraform) basics, a cloud/PaaS, GitHub
    Actions CD. — *deployment infra* — verified
14. **Observability, cost & ops** — Langfuse tracing; the **cost/usage dashboard** (FinOps,
    budgets, alerts, cost attribution); drift monitor → *orchestrated* scheduled retrain. —
    *observability + FinOps + MLOps* — verified/anchored
15. **Ship & get hired** — case study with metrics, résumé framing, and a **mock AI
    system-design interview on your own build**. — *productionization + interview* — verified

**Threaded throughout:** AI system-design thinking (introduced up front, exercised in #15);
*synthetic data* where it helps (#3, #7); and a **"how this scales in production"** callout
(K8s, Kafka/Spark, feature stores, managed cloud) wherever the tutorial-sized version is used.

**Optional bonus:** Multimodal — visual product search (image embeddings) + OCR on listings.

## Skill → coverage map (2026 screened skills → part)

| Hireable skill | Where |
|---|---|
| Python / data engineering / pipelines | 1, 14 (orchestration) |
| LLM internals (tokenization, attention, sampling) | 2 |
| Classic ML training + the math | 3 |
| Recommender systems | 4 |
| Embeddings, vector DBs, RAG | 5 |
| Hybrid search + reranking | 5 |
| Prompting / structured output / model selection | 6 |
| Fine-tuning (QLoRA, DPO) | 7 |
| Agents (ReAct/plan-execute, memory, HITL), text-to-SQL | 8 |
| MCP server development | 9 |
| Security, guardrails, governance, responsible AI | 10 |
| Evaluation (golden sets, LLM-as-judge, A/B, CI) | 11 |
| Serving + inference optimization + caching | 12 |
| Docker, IaC, cloud, CI/CD | 13 |
| Observability/tracing, AI FinOps, drift→retrain, experiment tracking/registry | 3,7,14 |
| AI system design | intro + 15 |

## Delivery strategy

- **Phased.** Ship Phase 1–2 as the first deliverable (already a strong mini-series),
  then continue phase by phase. Value is never gated on finishing all 15.
- **One companion repo** — `tutorial-dealfinder` (public), built incrementally with a git
  tag per part (`step-01` … `step-15`); `main` = finished. The learner watches the app grow.
  *(This extends the current "one repo per tutorial" convention; the create-tutorial skill /
  playbook gets a short note for capstone/multi-part series sharing one repo.)*
- **Authoring** uses the existing `create-tutorial` skill + `scaffold-tutorial.mjs`; new
  manifest series **"DealFinder — AI Engineering"**; covers via the per-series generator
  (its own glyph/accent); feeds/sitemap auto-pick it up.
- **Verified vs anchored** per the table; anchored parts link maintained free-tier notebooks
  and are stamped "as of <date>".

## Risks & mitigations

- **Size / completion risk** — months of work to author and complete. → Phase it; each phase
  stands alone as a portfolio artifact.
- **"Near-zero" overpromise** — → reframed to "engineer new to AI"; beginners routed to the RAG track.
- **GPU/anchored drift + cost** — → maintained notebooks, free tier, dated.
- **Ecosystem staleness** — → connector/abstraction patterns + signposting over hardcoded vendors.

## Out of scope (signposted, not built)

Kubernetes depth, Kafka/Spark streaming at scale, feature stores (Feast/Tecton), and
cloud-specific managed AI services (Bedrock/Vertex/SageMaker). Each gets a "how this scales"
callout so the learner can speak to the enterprise tool without building it here.

## Success criteria

A learner who finishes has: a **deployed live demo**, a **public step-tagged repo**, an
**installable MCP server**, a **written case study with real metrics** (retrieval hit-rate,
deal-scorer AUC, rec precision@k, latency/cost, eval deltas), and **résumé bullets** that map
1:1 to the screened skills above — plus the ability to defend it in an AI system-design interview.
