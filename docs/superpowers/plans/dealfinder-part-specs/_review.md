# DealFinder Part-Specs — Completeness & Coherence Review

**Reviewer:** Opus completeness/coherence critic
**Date:** 2026-07-07
**Scope:** all 33 part-specs + the course bible (`2026-07-06-dealfinder-regeneration-spec.md`)

Overall: the set is **structurally strong and near-build-ready**. Every bible map
row and all 8 benchmarked pillars are covered. The blocking problems are
**data-discipline** ones — the same hero-cast numbers (especially the Bose QC45
model-predicted fair price and residual sign) are quoted differently in ~8 parts,
which directly violates the reproducibility contract in bible §5. Fix the shared
numbers once in a "hero-cast facts" appendix before writing MDX.

---

## (a) One-line verdict per part

- **Part 01 — Data layer / snapshot:** OK. Strong entry point. Minor: says "12 items" for the headphones query where every later part says 18 — FIX the count here (see cross-cutting #2).
- **Part 02 — How LLMs work:** OK. Clean CONCEPT part, honestly labels illustrative token math. Right-sized.
- **Part 03 — Deal model (median vs. model):** FIX. This part is the *canonical source* of the Bose fair-price/residual numbers but quotes them as "~$290–$320" and residual "+$244" — inconsistent with Parts 12/14/17/18/19. Pin ONE value here and make all others cite it.
- **Part 04 — Recommender:** FIX. Pulls `embeddings.py` "forward from Part 5" while Part 5 says embeddings were "already wired in Part 4" — circular provenance. Also introduces a `canonical_id`/dedup module attributed to Part 1, but Part 1 called it `dedup_by_normalized_title` and Part 9 calls it `dedup_by_embedding`. Reconcile the dedup lineage.
- **Part 05 — Semantic search:** FIX. Embedding-ownership contradiction with Part 4 (see #3). Also quotes precise cosine sims (0.71/0.78/0.91/0.98) that must be reconciled with Part 13's (0.87–0.91) — same items, different vectors.
- **Part 06 — Extraction:** OK. Good dual-path framing. Confirm the "154/270" audit floor language matches Part 1/10/15 (it does).
- **Part 07 — Live sources:** OK. Well-scoped LIVE part. eBay-live vs. snapshot-excluded gap handled cleanly.
- **Part 08 — Scraping:** OK. Note it claims the snapshot "was itself produced by the Apify connector this part builds" — the bible says the snapshot came from RapidAPI+Apify; consistent enough, but Part 1 attributes the live pull to RapidAPI only. Align the provenance sentence.
- **Part 09 — Aggregation:** FIX. dedup threshold is `sim_threshold=0.90` here, `0.92` in Part 33, `0.95`+ in Part 22 cache (different purpose, but the *dedup* number must be single-valued). Pick one dedup cosine threshold course-wide.
- **Part 10 — QLoRA finetune:** FIX. Invents two new snapshot artifacts not in the bible: Bose `brand="46"` (a "price leak") and Anker `brand="mountainlifestyle.ca"`. The bible's messiness catalogue lists retailer-name pollution, not a price-in-brand leak. Either add these to the snapshot/bible or drop them; as written they're invented data.
- **Part 11 — Agent:** OK. HITL hexagon animation is a genuinely distinct shape. Tool set (`text_to_sql/score_deal/ask_human`) is coherent.
- **Part 12 — MCP:** FIX. `score_deal` returns `model_residual: 1.4` for the XM5 and `< -50` for Bose — a *different sign convention and magnitude* than Part 3 ($244) and Part 17/18 ($143–$199). Same root cause as #1.
- **Part 13 — pgvector:** FIX. Cosine sims (XM5 0.91, Bose 0.88) contradict Part 5's (XM5 0.91 as *self-sim* rank-1, Bose 0.78). Reconcile against one embedding run. Otherwise excellent; `VectorIndex` animation is distinct.
- **Part 14 — Web app:** FIX (worst single-part data mess). Within *one* part the Bose is "86% below median", "−2.1σ", then "residual_z = 2.3", then "2.9σ", and predicted fair price "≈$180" — none of which agree with each other or with Part 3's $290. Pin one residual_z and one predicted price.
- **Part 15 — Dataset engineering:** OK. Best-in-set on rigor (leakage taxonomy, group split). Minor: `good_deal=18 / suspicious=9` counts must be reconciled with Part 19's "8 golden" and Part 20's "30 labeled headphones."
- **Part 16 — Orchestration:** FIX. Asserts `condition_parsed="refurb"` for the Bose in dbt, but Parts 3/6 say the Bose title has *no* condition token (condition=null). This is the condition-contradiction (#4). Also flags exactly "3 outliers" — verify against the snapshot's actual `deal_pct < -1000` count.
- **Part 17 — ML/DL breadth:** FIX. Bose predicted "≈$280", residual "−$234"; Part 18 (which claims to track *this same model*) says predicted "$189.40", residual "+$143.40". Two parts training the identical GBDT cannot disagree on its output. Pin from Part 3.
- **Part 18 — Experiment tracking:** FIX. Residual-sign convention flips again (here "+$143.40 = trap"; Part 3 "+$244"; Part 12 "negative = trap"). Define residual = predicted − actual ONCE and state which sign flags a trap, globally.
- **Part 19 — Evaluation:** FIX. Uses precision@3 (threshold 0.9) and a Bose predicted "$245". Part 20 uses precision@10 (threshold 0.70); Part 24 uses precision@5 (≥0.72). The "eval gate" metric is defined three incompatible ways — unify k and threshold (#5).
- **Part 20 — MLOps loop:** FIX. Bose predicted "~$290", residual "+$244", deal_score 0.94 then "FLAGGED by condition guard" — but if condition is null (Parts 3/6) the "condition guard" can't fire on refurb. Also "30 labeled headphone items" exceeds the 18-item subset. Reconcile metric (precision@10, 0.70) with Parts 19/24.
- **Part 21 — Safety:** FIX (redundancy). Builds `PIIScrubber`, injection guard, output validator, OWASP mapping — then Part 31 builds a *second* PII scrubber + OWASP map + rate limiter. Draw a crisp line: Part 21 = single-request model-surface hardening; Part 31 = multi-tenant/at-scale (GDPR, sliding-window, abuse). State in both specs that Part 31 *extends* Part 21's modules, not re-implements them.
- **Part 22 — Serve:** OK. `text-embedding-3-small` (OpenAI) for query embeds vs. `bge-small` (fastembed) for corpus is a real inconsistency with Parts 4/5/13 (which are all bge-small). Decide: is the query path OpenAI or fastembed? (Marked FIX-lite.)
- **Part 23 — Inference optimization:** OK. GAP #8 well-covered; both animations distinct. Confidence-router slow-path rate (~15%) is internally consistent.
- **Part 24 — Deploy:** FIX. Golden-set eval gate is "precision@5 ≥ 0.72 on a 54-item headphones golden set" — but the headphones subset is 18 items everywhere else and Part 19's golden set is 8. A 54-item headphones golden set cannot exist. Correct the size + metric to match Part 19.
- **Part 25 — Cloud/K8s:** OK. Seed-verification SQL cleanly re-pins the 4 hero prices. Distinct `SecretsVault` animation.
- **Part 26 — Observability:** OK. Cost math is real and sourced; `TraceWaterfall` distinct. Best FinOps grounding.
- **Part 27 — Frontend:** FIX (two bugs). (1) Animation 2 title is corrupted: `Stateмашine` (Cyrillic). (2) Worked example says batch-2 `count: 8` but the Playwright fixture says `count: 5` for the same event. Align.
- **Part 28 — Auth:** OK. Clean RBAC matrix. Free-vs-pro capability table is coherent.
- **Part 29 — Saved searches:** OK. Deterministic mock-tick diff test is solid. XM5 → $149 (−8.6%) is a self-contained example, not a snapshot claim — fine.
- **Part 30 — Payments:** OK. Idempotent-webhook framing is strong. Redis TTL trade-off honestly flagged.
- **Part 31 — Security/compliance:** FIX (redundancy w/ Part 21 — see Part 21 verdict). Otherwise strong; `SlidingWindow` distinct.
- **Part 32 — Ship/operate:** OK. e2e asserts Bose "no Deal badge" — but Part 14/27 render the Bose with a SUSPICIOUS badge; "no *deal* badge" vs "a *warning* badge" is a naming trap that will break the Playwright selector. Align badge taxonomy (GREAT_DEAL/FAIR/SUSPICIOUS) course-wide.
- **Part 33 — Case study:** FIX. Quotes Anker predicted "~$80–$90" / "~$85" and Bose "~$280" — introducing yet another Anker fair-price figure (Part 3 said ~$48; Part 17 said ~$48, residual +$3; Part 20 said ~$130, residual +$85). The capstone must cite the pinned values, not new ones.

---

## (b) Prioritized cross-cutting issues

1. **[BLOCKER] Hero-cast model numbers are not pinned.** The Bose QC45 model-predicted "fair price" appears as $180, $189.40, $245, $280, $290, "$290–$320"; its residual as +$143, +$199, +$234, +$244, "<−50", and residual_z as 2.1/2.3/2.9σ. The Anker fair price appears as $48, $52, $80–$90, $130. Bible §5 says every quoted metric "must come from code run against the committed snapshot, and a test must pin it." Right now the specs *pre-quote* numbers that (a) contradict each other and (b) can't all be true of one model. **Action:** add a `_hero-cast-facts.md` (or a table in the bible) with the single canonical set — median, each item's price, model-predicted fair price, residual, residual sign convention, deal_score — computed from the re-spined companion. Every part cites that table; no part invents.

2. **Residual sign convention is undefined and used inconsistently.** Parts variously treat "predicted − actual" as positive-flags-trap (3, 17, 18, 20) and negative-flags-trap (12, 14). Define `residual = predicted_fair − actual`; **large positive = suspiciously cheap = trap.** State it in the bible §4 and make Parts 12 & 14 conform.

3. **"noise cancelling headphones" subset size disagrees.** 12 (P1), 18 (P3,5,6,11,13,23), 15 (P4,19), "18–22" (P3 body), "30 labeled" (P20), "54-item golden" (P24). The true snapshot count is a fixed fact. **Action:** run it once, put the number in the bible, and make every part use it (and derive golden-set sizes as subsets of it — a 54-item headphones golden set is impossible if the subset is 18).

4. **Embedding provenance loop (Parts 4/5) and dedup-module lineage (Parts 1/4/9).** Part 4 says it pulls embeddings forward from Part 5; Part 5 says embeddings were wired in Part 4. Pick: **Part 4 introduces + caches embeddings; Part 5 reuses.** For dedup: Part 1 = normalized-title dedup; Part 9 = embedding dedup; Part 4 references a `canonical_id` that neither defines. Name one canonical-id source and thread it.

5. **The eval-gate metric is defined three ways.** precision@3≥0.9 (P19), precision@10≥0.70 (P19/P20), precision@5≥0.72 (P24). CI cannot enforce three. **Action:** choose one k + one threshold for "the eval gate" and use it identically in Parts 19, 20, 24, 32.

6. **Bose `condition` contradiction.** Parts 3, 6, 15 say the title has *no* condition token (condition=null; that's *why* the price model, not a condition rule, must catch it). Parts 16, 17, 20 assert `condition="refurb"` and a "condition guard." This undercuts the central narrative (the model residual is the guard, not a parsed condition). **Action:** keep condition=null for the Bose; the trap is caught by the *residual*, never by a condition token. Fix Parts 16/17/20.

7. **Redundancy: safety split (Part 21 vs 31) and OWASP/PII taught twice.** Also the two-signal deal score is re-derived in Parts 3, 4, 12, 14, 17, 19, 20, 33. Some repetition is pedagogically fine, but the PII scrubber + OWASP map are *built twice as new code*. **Action:** Part 21 owns the modules; Part 31 imports + extends (sliding-window, GDPR, at-scale). Add an explicit "extends, not re-implements" line to both.

8. **Embedding model split (Part 22).** Corpus uses fastembed `bge-small` everywhere; Part 22 introduces OpenAI `text-embedding-3-small` for query embeds and a semantic cache keyed on it. Two embedding spaces can't share a cosine cache. Reconcile to one model for the query+corpus path (recommend fastembed for reproducibility; if OpenAI is intentional for the *serving* lesson, say so and explain the space mismatch).

9. **Badge taxonomy naming.** GREAT_DEAL/FAIR/SUSPICIOUS (Parts 14/27) vs "Genuine deal"/"Verify condition" (Part 33) vs "no Deal badge" (Part 32 selector). One vocabulary, or the Playwright selectors in Parts 27/32 will diverge from the render logic.

10. **Minor text bugs.** Part 27 animation name `Stateмашine` (Cyrillic corruption → `SearchStateMachine`). Part 27 batch-2 count 8-vs-5 mismatch. Part 09 vs 33 dedup threshold (0.90 vs 0.92). Part 08 snapshot-provenance sentence vs Part 1.

**Coverage / redundancy verdict:** No missing bible rows; no missing pillar (GAPs #1–#8 all land in Parts 15/18/19/20/23/16/17 as mapped). No part is too thin to merge. No part is oversized enough to *require* a split, though Parts 21 and 31 overlap enough that the split must be re-justified in-spec (see #7). Animation discipline is genuinely good — I found **no reused shape padding** and no non-static-safe animation; new metaphors (OAuthFlow, VectorIndex, CanaryGate, TraceWaterfall, SlidingWindow, fault-bolt ChaosRecovery, HITL hexagon) are each distinct.

---

## (c) Top 5 to fix before the build phase

1. **Pin the hero-cast facts once.** Create the canonical table (median, prices, model-predicted fair price per item, residual, deal_score) from the re-spined companion and make every part cite it. Kills issues #1, #2, and the bulk of the per-part FIXes in one move.

2. **Fix the residual sign convention** (`predicted − actual`; large positive = trap) in the bible, and correct Parts 12 & 14 which invert it.

3. **Settle the "noise cancelling headphones" subset count** (one snapshot-true number in the bible) and derive all golden-set sizes from it — correct Parts 1 (12→N), 4/19 (15→N), 20 (30→subset), and 24 (54-item golden set is impossible).

4. **Unify the eval-gate metric** (single k + threshold) across Parts 19/20/24/32, and settle the Bose `condition=null` narrative so the residual — not a condition token — is the guard (fix Parts 16/17/20).

5. **Resolve the two structural provenance issues:** embeddings (Part 4 introduces / Part 5 reuses) + dedup lineage (name one canonical-id source), and formalize the Part 21→31 "extends not re-implements" split. Then fix the small text bugs (Part 27 Cyrillic name + count; badge taxonomy; dedup threshold).
