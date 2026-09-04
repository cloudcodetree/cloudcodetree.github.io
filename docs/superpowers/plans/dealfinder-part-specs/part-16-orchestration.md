# Part 16 — Pipelines & orchestration (Prefect, batch/stream, dbt, contracts)

**Phase:** P3 — Data engineering that scales
**Data mode:** INFRA
**Bible note:** GAP #5

---

## 1. Objective

The learner wires the DealFinder data pipeline into a Prefect flow — snapshot ingest, dbt transformations, data-contract validation, and a streaming branch — so every downstream model and eval runs against a provably fresh, schema-validated corpus rather than a manually rebuilt file.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot schema, `build_snapshot.py`, normalizer)
- Part 7 — Live multi-source connectors (API adapters, async fetch pattern)
- Part 9 — Tiered aggregation & resilience (circuit breaker, dedup merge)
- Part 15 — Dataset engineering (temporal splits, leakage guards, label versioning)

---

## 3. By the end, the learner can…

- Define a Prefect flow that ingests the electronics snapshot, validates it against a Pandera data contract, and writes versioned parquet to a local warehouse.
- Add a dbt model that materializes the `clean_listings` view (retailer-name stripped from `brand`, outlier rows flagged) on top of the raw ingest.
- Route a streaming branch so new live results flow through the same contract gate before reaching the serving layer.
- Configure a schedule (cron or interval) and inspect flow-run history and task-level logs in the Prefect UI.
- Explain what a data contract buys that a schema check alone does not (statistical assertions, not just types).

---

## 4. Data

**Primary:** frozen snapshot `companions/dealfinder/data/snapshots/electronics-2026-07.json` — 270 items, 18 queries, 11 categories.

Specific numbers used in the tutorial (all from the snapshot, no invented values):

- 270 total rows ingested; 154 rows where `brand` holds a retailer string (e.g. "Walmart - COWIN", "Target") — the dbt `clean_listings` model strips these back to the manufacturer extracted from the title.
- The Pandera contract asserts: `price` in [0.01, 14000], `deal_pct` in [-4000, 100], `category` in the 11 known values; row count ≥ 200 (soft lower bound for CI). Any row with `deal_pct < -1000` is flagged `outlier=True` rather than dropped — dbt flag, not delete.
- The streaming branch is illustrated with a mocked HTTP push of the 4 hero-cast items; no live API call is required.

**Live APIs:** not called in this part (INFRA mode). The Prefect flow's `ingest_task` can run against the frozen JSON file or against a mocked HTTP adapter.

---

## 5. Worked example

The walkthrough follows a single `prefect run` invocation:

1. **Trigger:** `prefect run flow dealfinder_ingest --param source=electronics-2026-07.json`
2. **Task `load_raw`:** reads the 270-item snapshot → emits a DataFrame; logs `rows=270`.
3. **Task `validate_contract`:** Pandera schema check passes; 3 rows fail the `deal_pct > -1000` assertion and are tagged `outlier=True` (one is the mispriced outlier at −3785%). Log shows `contract: 267 ok / 3 flagged`.
4. **Task `run_dbt`:** materializes `clean_listings` — the Sony WH-1000XM5 at Costco ($162.97) has `brand_clean="Sony"` extracted from its title; the Bose QC45 at $46 carries `outlier=True` and `condition_parsed="refurb"`. The Anker Q20i at $44.99 passes all assertions with `outlier=False`.
5. **Task `write_parquet`:** writes `warehouse/clean_listings/run=<run_id>/data.parquet` (~48 KB).
6. **Streaming branch demo:** a mock event queue pushes the 4 hero-cast rows through the same `validate_contract` task in micro-batch mode; the Bose QC45 triggers a `WARN: outlier flagged` log without halting the flow.

Expected terminal output: `Flow run 'dealfinder_ingest' finished in state Completed. Tasks: 5 completed, 0 failed.`

---

## 6. Companion code

**Existing modules (dealfinder/):**
- `data/build_snapshot.py` — snapshot builder; `ingest_task` wraps it as a Prefect task.
- `data/normalize.py` — retailer-stripping logic; called inside dbt model via `dbt-python` or referenced in a SQL `CASE` expression.
- `aggregate.py` — referenced only for the streaming branch interface (no changes).

**New in this part:**
- `pipelines/dealfinder_flow.py` — Prefect flow definition (`ingest_task`, `validate_contract`, `run_dbt`, `write_parquet`, `stream_branch`).
- `pipelines/contract.py` — Pandera schema for the electronics listings contract.
- `dbt/models/clean_listings.sql` + `dbt/models/schema.yml` — the single materialized view this part introduces.
- `tests/test_pipeline.py` — asserts flow completes with the frozen snapshot; pins contract pass/fail counts.

**Step tags:** `step-16` in `tutorial-dealfinder`. This is a NEW part (no prior step maps to it). The diff from `step-15` to `step-16` adds only the `pipelines/` and `dbt/` trees.

---

## 7. Animations

**Animation 1 — REUSE `CDPipeline`** re-themed to the data pipeline: replace the "build → test → deploy" stages with `ingest → validate → transform → serve`. Labels show the 270→267→267 row count progression (3 outliers flagged, not dropped). Same linear left-to-right stage shape; electronics context makes it concrete.

**Animation 2 — NEW `DataContractGate`:** Visual metaphor: a turnstile/gate icon in the center of the canvas. On the left, a stream of rows flows in (represented as small rectangles). Rows that pass the Pandera assertions glide through the gate green; the outlier row (deal_pct −3785%) bounces off the gate and lands in a `flagged` bin on the right. A counter ticks from 0→267 (pass) and 0→3 (flagged). Framer Motion: staggered row entrance, gate flash on reject, counter increment. Static-export-safe — no runtime fetch, all values hard-coded from the snapshot. Concept made visible: a data contract is a runtime assertion on shape AND statistics, not just a type schema.

---

## 8. Teaching beats

1. **Why orchestration?** Show a shell script that calls `build_snapshot.py`, runs dbt, and writes parquet. Ask: what happens when one step fails at 3 a.m.? Motivates retries, observability, scheduling.
2. **Prefect basics:** flow → tasks → runs. Install; write `hello_world` flow; run locally; open UI at `http://localhost:4200`.
3. **Wrap the ingest:** convert `build_snapshot.py` call to a `@task`; add retry on `HTTPError`. Run against the frozen JSON — show `rows=270` in task logs.
4. **Data contract with Pandera:** define the schema; run it; show the 3 flagged outlier rows. Explain why flagging beats dropping (downstream parts need the full row count; they can filter `outlier=False` themselves).
5. **dbt model:** write `clean_listings.sql`; `dbt run`; query the result in DuckDB. Show Sony's `brand_clean="Sony"`, Bose QC45's `outlier=True`.
6. **Wire it together:** add `run_dbt` and `write_parquet` as downstream tasks in the flow; show the DAG in the Prefect UI.
7. **Streaming branch:** add a `stream_branch` task that reads from an asyncio queue; run the 4 hero-cast rows through the same contract gate; show the WARN log for the Bose.
8. **Schedule:** `flow.serve(cron="0 6 * * *")` — explain what this means for a daily refresh cycle and how it connects to the MLOps loop in Part 20.
9. **Proof:** run `pytest tests/test_pipeline.py` — green. The pipeline is now reproducible CI-safe infrastructure, not a shell script.

---

## 9. Cross-references

**Back:** Part 15 (Dataset engineering) establishes the temporal splits and label-versioning conventions that the Prefect flow's `write_parquet` task must preserve — the `run=<run_id>` partition scheme mirrors the split discipline from Part 15.

**Forward:** Part 17 (ML & DL breadth) trains the gradient-boosted price model directly from `warehouse/clean_listings/` parquet output produced by this flow — the first part to consume the orchestrated warehouse rather than the raw JSON snapshot.

---

## 10. Reproducibility checks

```python
# tests/test_pipeline.py
def test_flow_completes_on_frozen_snapshot():
    result = run_flow(source="electronics-2026-07.json")
    assert result.state.is_completed()
    assert result.task_results["load_raw"]["rows"] == 270

def test_contract_flags_outliers():
    result = run_flow(source="electronics-2026-07.json")
    stats = result.task_results["validate_contract"]
    assert stats["ok"] == 267
    assert stats["flagged"] == 3

def test_dbt_clean_listings_sony_brand():
    df = duckdb.query("SELECT brand_clean FROM clean_listings WHERE title LIKE '%WH-1000XM5%' AND price = 162.97").df()
    assert df.iloc[0]["brand_clean"] == "Sony"

def test_dbt_bose_flagged_outlier():
    df = duckdb.query("SELECT outlier FROM clean_listings WHERE title LIKE '%QuietComfort 45%' AND price = 46.0").df()
    assert df.iloc[0]["outlier"] == True
```

The exact counts (270, 267, 3) are pinned to the committed snapshot. If the snapshot is regenerated, these tests must be updated with the new counts and the spec annotation revised.

---

## 11. Risks / notes

- **Prefect version:** pin to `prefect>=2.19,<3` in `pyproject.toml`; the Prefect 3.x API differs. The tutorial notes this and will be updated when the course adopts 3.x.
- **dbt-duckdb adapter:** use `dbt-duckdb` (not `dbt-core` + postgres) to keep the local dev path dependency-free. CI uses the same adapter.
- **No live API calls:** this part is INFRA mode; all flow runs in CI use the frozen JSON. The streaming branch uses an asyncio mock queue, not a real Kafka/Redis endpoint, so no external service is required.
- **Non-determinism:** Pandera row-count assertions are exact against the frozen snapshot; no ML outputs or LLM calls in this part, so no sampling variance.
- **Cost:** zero cloud cost — Prefect runs locally (self-hosted server mode via `prefect server start`). No Prefect Cloud account required.
- **dbt model complexity:** the `clean_listings.sql` model is intentionally simple (a SELECT with CASE expressions for retailer stripping and a flag column). The complexity lives in the Prefect orchestration layer, not dbt — keeping the two concerns separate is itself a teaching point.
