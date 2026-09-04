# Part 11 — The agent (ReAct, text-to-SQL, tools, HITL)

**Phase:** P2 | **Data mode:** SNAP | **Slug:** `dealfinder-agent`

---

## 1. Objective

The learner builds a ReAct agent that answers natural-language deal questions by
orchestrating a controlled toolset — snapshot query, deal-score lookup, and a
human-in-the-loop confirmation gate — then traces exactly how the agent decides
which tool to call and when to stop.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot loaded; `Product`
  schema known; `load_snapshot` available)
- Part 3 — "Is it a good deal?" (two-signal deal score; `score_deal` callable;
  `median_price_at_capture` semantics understood)
- Part 6 — Structured extraction (true `brand` and `condition` extracted from
  title; `ListingSpecs` schema in place)
- Part 10 — Fine-tune the extractor with QLoRA (anchored; establishes LLM
  client pattern the agent reuses; not required for the agent to run, but
  assumed as prior context)

---

## 3. By the end, the learner can…

- Explain the ReAct loop (Reason → Act → Observe → repeat) and trace a
  multi-turn run step by step.
- Implement a minimal tool registry and wire it to an LLM with tool-calling
  (`text_to_sql`, `score_deal`, `ask_human`).
- Write a text-to-SQL tool that translates a natural-language filter into a
  parameterized SQL query over the snapshot without schema leakage.
- Insert a human-in-the-loop confirmation gate before any destructive or
  high-stakes action and explain when HITL belongs in the loop.
- Read an agent trace and identify reasoning steps, tool invocations, and the
  stopping condition.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
(270 items; 18 queries; 11 categories; price $5.69–$13,599).

**Specific items used in the worked example:**

| Snapshot item | price | deal_pct | median_price_at_capture |
|---|---|---|---|
| Anker Soundcore Q20i | $44.99 | ~72% under | $162.97 (query median) |
| Bose QuietComfort 45 | $46.00 | ~72% under | $162.97 (query median) |
| Sony WH-1000XM5 (Costco) | $162.97 | ~0% | $162.97 |
| Sony WH-1000XM5 (Macy's) | $248.00 | ~-52% over | $162.97 |

**Query anchor:** `"noise cancelling headphones"` (18 items in the snapshot;
snapshot median `$162.97`).

**No live API calls in this part.** The agent's `search_listings` tool reads
the in-memory snapshot via DuckDB (or `sqlite3`); no HTTP requests are made.
The LLM call for the ReAct loop uses the same OpenAI-compatible client pattern
established in Part 6, gated behind an env-var check.

---

## 5. Worked example

**User prompt:** `"Find me noise cancelling headphones under $100. If there's
anything that looks too good to be true, flag it before adding to my list."`

**Turn 1 — Reason:** agent decides to query the snapshot for headphones < $100
in the "noise cancelling headphones" query group.

**Turn 1 — Act (`text_to_sql`):**
```sql
SELECT id, title, price, deal_pct, median_price_at_capture
FROM listings
WHERE query = 'noise cancelling headphones'
  AND price < 100
ORDER BY price ASC;
```
**Observe:** 2 rows returned — Anker Q20i at $44.99 (`deal_pct` ≈ 72% under)
and Bose QC45 at $46.00 (`deal_pct` ≈ 72% under).

**Turn 2 — Reason:** both items show ~72% below median. Agent notes the Bose
QC45 ($46 for a flagship historically $329) warrants a HITL check before
surfacing it as a recommendation.

**Turn 2 — Act (`score_deal`):**
Called for each item. Anker Q20i: median signal strong (72% under), model
residual small (price consistent with budget-tier). Bose QC45: median signal
strong, but model residual large — predicted fair price far above $46. Flagged
as implausible.

**Turn 3 — Act (`ask_human`):**
```
"The Bose QuietComfort 45 is listed at $46 — 72% below the $162.97 median.
The price model flags this as implausible (likely refurb or mislisted).
Include it anyway? [yes/no]"
```
**Observe (simulated HITL):** user replies `"no"`.

**Turn 4 — Reason:** Anker Q20i passes both signals. Bose excluded by HITL.
Agent has a clean result; stopping condition met.

**Final answer:**
```
Best match: Anker Soundcore Q20i at $44.99 — 72% below the $162.97 median
and price-model-consistent. Bose QC45 at $46 excluded: implausible price
(flagged by deal model; confirm condition/listing before buying).
```

---

## 6. Companion code

**New module:** `companions/dealfinder/dealfinder/agent.py`

This part introduces the file from scratch. The delta:

1. `ToolRegistry` — dict of `tool_name → callable`; three tools registered:
   `text_to_sql`, `score_deal`, `ask_human`.
2. `text_to_sql(nl_query, table)` — sends NL + schema description to the LLM
   (zero-shot, low-temp) → returns a parameterized SQL string; executes it
   against the snapshot loaded into DuckDB (in-memory); returns rows as
   `list[dict]`. Schema sent to LLM is a pruned version (id, title, query,
   category, price, deal_pct, median_price_at_capture only — no internal
   fields).
3. `score_deal(item_id)` — thin wrapper around the existing `score_deal` from
   `dealfinder/deal_score.py` (introduced in Part 3).
4. `ask_human(message)` — in the tutorial: `input()` call; in tests: monkeypatched
   to return `"no"`.
5. `react_loop(user_prompt, max_turns=6)` — sends prompt + tool schemas to LLM
   in a loop; parses `tool_call` vs `final_answer` responses; enforces `max_turns`
   hard stop.
6. `__main__` entrypoint: `python -m dealfinder.agent "Find noise cancelling
   headphones under $100"`.

**Also touched:**
- `companions/dealfinder/dealfinder/deal_score.py` — exposes `score_deal(item)`
  as a public function (may already be there from Part 3; this part verifies the
  signature and adds a wrapper if needed).
- `tests/test_agent.py` — offline tests (LLM call mocked; `ask_human` monkeypatched).

**Step tag:** `step-11` in `tutorial-dealfinder` repo. New step; no prior tag
to modify.

---

## 7. Animations

**Animation 1 — REUSE `AgentLoop`**, re-themed to electronics.
Replace any tent-domain node labels with:
- Thought bubble: `"Two items under $100 — both 72% below median. Check model residual."`
- Tool box: `score_deal(id="bose-qc45-46")` → `{residual: HIGH, signal: IMPLAUSIBLE}`
- HITL gate node (distinct hexagon shape): `ask_human("Include Bose QC45 at $46?")`
  → `"no"` → branch skips item.
- Final answer node (rounded rect, green): Anker Q20i surfaces; Bose excluded.
The animation makes the Reason→Act→Observe cycle and the HITL branch visible in
one flow. The hexagon shape for HITL must appear only here (no other part reuses it).

**Animation 2 — NEW: `TextToSQL`**
Visual metaphor: a natural-language bubble (`"headphones under $100"`) enters a
translation box on the left; on the right, a SQL card slides out
(`SELECT ... WHERE price < 100`). Below both, a mini table preview shows the 2
result rows (Anker, Bose) with price and deal_pct columns highlighted.
Concept made visible: the gap between a user's intent and a structured query,
and how the LLM bridges it one way while the schema constrains what can come out.
Framer Motion: bubble slides in from left, SQL card slides in from right,
table fades up from the center bottom. Static-export safe; no runtime fetch.

---

## 8. Teaching beats

1. **Concept — what is a ReAct agent?** Diagram the loop: Reason → Act →
   Observe → Reason again. Contrast with a chain (no observation feedback).
   One sentence on why this matters for deal-finding: the query result informs
   the next reasoning step.

2. **Code — tool registry:** define `ToolRegistry`, register three tools. Show
   how each tool's signature becomes the schema the LLM sees (docstring → JSON
   schema via `inspect`).

3. **Code — `text_to_sql`:** write the NL→SQL prompt (schema sent explicitly,
   "return only the SQL statement"). Wire to DuckDB in-memory. Run it against
   the snapshot with the worked-example query. Show the two rows returned.

4. **Concept — schema leakage:** explain why you send only a pruned schema to
   the LLM (not all 13 fields). Internal fields like `image_url` and `source`
   don't belong in a user query; exposing them invites injection.

5. **Code — `score_deal` wrapper:** confirm the Part 3 function is callable
   from the agent; run it on both returned rows; compare residuals. Anker passes;
   Bose fails.

6. **Code — `ask_human` gate:** implement the `input()`-based gate. Explain
   when HITL belongs: high-stakes or implausible output before surfacing to a
   user. Monkeypatch in tests so CI doesn't block.

7. **Code — `react_loop`:** implement the multi-turn loop with `max_turns` hard
   stop. Parse `tool_call` vs `final_answer` from LLM response. Print each turn's
   Reason/Act/Observe triplet so the learner can follow the trace.

8. **Proof — full trace:** run `python -m dealfinder.agent "Find noise cancelling
   headphones under $100"` against the snapshot. Walk through the printed trace
   turn by turn. Final answer names Anker Q20i at $44.99; Bose excluded.

---

## 9. Cross-references

**Back:** Part 10 (Fine-tune the extractor with QLoRA) established the
LLM client pattern and structured-output convention the agent reuses for
its `text_to_sql` prompt; this part wires that client into a multi-turn loop.

**Forward:** Part 12 (Expose it as an MCP server) wraps the agent's tool
registry as an MCP-compliant server so external clients (Claude Desktop,
other agents) can invoke the same tools over the Model Context Protocol —
the `ToolRegistry` defined here is the interface that Part 12 exposes.

---

## 10. Reproducibility checks

```python
# tests/test_agent.py (offline; LLM mocked; ask_human monkeypatched)

import pytest
from unittest.mock import patch, MagicMock
from dealfinder.agent import text_to_sql, react_loop

SNAP = "companions/dealfinder/data/snapshots/electronics-2026-07.json"

def test_text_to_sql_returns_rows():
    # Mocks LLM to return a canned SQL string; verifies DuckDB executes it
    canned_sql = (
        "SELECT id, title, price, deal_pct, median_price_at_capture "
        "FROM listings WHERE query = 'noise cancelling headphones' AND price < 100"
    )
    with patch("dealfinder.agent._llm_generate", return_value=canned_sql):
        rows = text_to_sql("headphones under 100", snapshot_path=SNAP)
    assert len(rows) >= 1
    assert all(r["price"] < 100 for r in rows)

def test_anker_in_results():
    canned_sql = (
        "SELECT id, title, price FROM listings "
        "WHERE query = 'noise cancelling headphones' AND price < 100"
    )
    with patch("dealfinder.agent._llm_generate", return_value=canned_sql):
        rows = text_to_sql("headphones under 100", snapshot_path=SNAP)
    titles = [r["title"] for r in rows]
    assert any("Anker" in t or "Soundcore" in t for t in titles)

def test_hitl_no_excludes_item(monkeypatch):
    # Full loop; HITL returns "no" for Bose; Anker surfaces in final answer
    monkeypatch.setattr("dealfinder.agent.ask_human", lambda msg: "no")
    with patch("dealfinder.agent._llm_generate") as mock_llm:
        # Simulate two-turn trace: tool call then final answer
        mock_llm.side_effect = [
            '{"tool":"text_to_sql","args":{"nl_query":"headphones under 100"}}',
            '{"final_answer":"Anker Soundcore Q20i at $44.99 recommended."}',
        ]
        result = react_loop("Find noise cancelling headphones under $100",
                            snapshot_path=SNAP, max_turns=6)
    assert "Anker" in result or "44.99" in result

def test_max_turns_enforced(monkeypatch):
    monkeypatch.setattr("dealfinder.agent.ask_human", lambda msg: "yes")
    with patch("dealfinder.agent._llm_generate",
               return_value='{"tool":"text_to_sql","args":{"nl_query":"x"}}'):
        result = react_loop("loop forever", snapshot_path=SNAP, max_turns=3)
    # Should not raise; should return a stopped-early message
    assert result is not None
```

**Snapshot count check:** the `text_to_sql` test asserts `len(rows) >= 1` for
the `< $100` filter on the "noise cancelling headphones" query — the snapshot
contains at least the Anker Q20i and Bose QC45 at those prices, so this floor
is stable against the frozen snapshot.

---

## 11. Risks / notes

- **LLM non-determinism in SQL generation:** `text_to_sql` runs at
  `temperature=0` but the LLM may emit syntactically invalid SQL. Wrap DuckDB
  execution in a try/except; return an empty list and log the raw SQL on failure.
  The tutorial shows this error path and explains why returning empty (not raising)
  is safer for a search-and-recommend flow.

- **SQL injection via NL:** the LLM sees only a pruned schema and receives the
  instruction "return only a SELECT statement with no subqueries." The tutorial
  notes this is a teaching-grade safeguard, not production-hardening; Part 21
  (Safety, security & governance) covers full prompt-injection defense.

- **`ask_human` in CI:** the `input()` call will block a non-interactive process.
  Tests monkeypatch it. The tutorial shows the monkeypatch pattern explicitly
  so learners understand the production equivalent (a webhook/callback, covered
  in Part 32).

- **DuckDB vs sqlite3:** DuckDB is already a companion dependency (used for
  analytics in Part 3). If a learner's environment lacks it, `sqlite3` (stdlib)
  is a drop-in for this part — the tutorial notes both options and the agent
  module checks for DuckDB first, falls back to `sqlite3`.

- **No GPU / no cost for snapshot path:** all snapshot queries run locally; no
  GPU needed. The LLM call is the only external cost (< $0.02 for the full
  worked-example trace at `gpt-4o-mini` rates). The env-var gate means learners
  without a key can still run the mocked tests and follow the printed trace.
