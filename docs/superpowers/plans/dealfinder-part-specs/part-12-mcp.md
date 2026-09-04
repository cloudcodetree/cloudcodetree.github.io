# Part 12 — Expose it as an MCP server

**Phase:** P2 | **Data mode:** SNAP | **Slug:** `dealfinder-mcp`

---

## 1. Objective

The learner wraps the DealFinder agent's tools, snapshot catalog stats, and a
reusable prompt template into a standards-compliant MCP server so that Claude Code
and any other MCP-speaking client can call `score_deal`, `search_deals`, and
`recommend` without bespoke glue.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot loaded; `Product`
  schema known)
- Part 3 — "Is it a good deal?" (two-signal deal score implemented as a callable
  function)
- Part 4 — Recommender (content-similarity `recommend()` callable)
- Part 5 — Semantic search (`search_deals()` callable)
- Part 11 — The agent (ReAct loop, tool definitions established; MCP is the
  protocol-layer promotion of those same tools)

---

## 3. By the end, the learner can…

- Explain the three MCP primitives (Tools, Resources, Prompts) and which controls
  each (model / app / user).
- Register existing Python callables as MCP **tools** with typed JSON schemas and
  expose them over stdio transport.
- Surface a static catalog summary as an MCP **resource** (`dealfinder://catalog/stats`)
  so a client can read snapshot metadata without calling a tool.
- Define a **prompt template** (`find_a_deal`) that fills query and budget arguments
  into a reusable user message and attach it to the server.
- Connect the running server to Claude Code via `.mcp.json` and invoke tools
  interactively in a real session.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
(270 items, 18 queries, 11 categories; snapshot median for "noise cancelling
headphones" = $162.97).

**Snapshot facts surfaced as the Resource:**
- Total items: 270
- Queries: 18
- Categories: 11
- Price range: $5.69–$13,599
- Anchor query median (`noise cancelling headphones`): $162.97

All values are read from the committed snapshot at server start; no live API call
is made. The tool functions (`score_deal`, `search_deals`, `recommend`) operate
on the in-memory snapshot loaded by `snapshot.py`.

---

## 5. Worked example

**Client session (Claude Code, after wiring `.mcp.json`):**

```
User: Use the MCP server to score this deal.
      Title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones"
      Price: $162.97  Category: audio
```

**Tool call emitted by the model:**
```json
{
  "tool": "score_deal",
  "arguments": {
    "title": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    "price": 162.97,
    "category": "audio"
  }
}
```

**Server response (from the two-signal deal score, Part 3):**
```json
{
  "deal_pct": 0.0,
  "model_residual": 1.4,
  "verdict": "fair price — at the query median ($162.97)",
  "signal": "median"
}
```
`deal_pct` ≈ 0% because the XM5 at Costco sits exactly at the snapshot median.
`model_residual` near zero confirms the price model also sees it as fair.

**Contrast — the budget deal:**
```
score_deal("Anker Soundcore Q20i Hybrid ANC Headphones", 44.99, "audio")
→ deal_pct ≈ 72.4%, model_residual > 0 (positive, genuinely under fair price)
→ verdict: "strong deal"
```

**Contrast — the trap:**
```
score_deal("Bose QuietComfort 45 Bluetooth Wireless Headphones", 46.00, "audio")
→ deal_pct ≈ 71.8% (median-signal says "buy!")
→ model_residual < 0 (model says fair price for this SKU is >> $46 → flag)
→ verdict: "too-good-to-be-true — model residual negative; verify condition"
```

The two-signal divergence at the Bose listing is the teaching moment: the MCP tool
returns the *full signal object*, not a scalar, so the client can present both
numbers and the verdict.

**Resource read:**
```
resource: dealfinder://catalog/stats
→ { "total": 270, "queries": 18, "categories": 11,
    "price_min": 5.69, "price_max": 13599,
    "anchor_query": "noise cancelling headphones",
    "anchor_median": 162.97 }
```

**Prompt invocation:**
```
prompt: find_a_deal  args: { "query": "noise cancelling headphones", "budget": 100 }
→ "Find me the best deal on noise cancelling headphones under $100.
   Use score_deal to evaluate each candidate and explain your reasoning."
```

---

## 6. Companion code

**New module:** `companions/dealfinder/dealfinder/mcp_server.py`
This file does not exist in the companion repo at the start of this part — it is
introduced here.

**Existing modules used (read-only):**
- `dealfinder/score.py` — `score_deal(title, price, category)` callable (Part 3)
- `dealfinder/search.py` — `search_deals(query, k)` callable (Part 5)
- `dealfinder/recommend.py` — `recommend(item_id, k)` callable (Part 4)
- `dealfinder/snapshot.py` — `load_snapshot()` (Part 1)

**Step tag:** `step-12` in `tutorial-dealfinder` (NEW step).

**Code delta introduced in `mcp_server.py`:**
1. `mcp = FastMCP("dealfinder")` — server init; `stdio` transport by default.
2. Three `@mcp.tool()` decorators wrapping `score_deal`, `search_deals`,
   `recommend` with typed Pydantic input models and docstrings (these become the
   tool descriptions the model sees).
3. One `@mcp.resource("dealfinder://catalog/stats")` handler returning the static
   snapshot summary dict (computed once at import from the loaded snapshot).
4. One `@mcp.prompt("find_a_deal")` handler accepting `query: str, budget: float`
   and returning the user-message template string.
5. `if __name__ == "__main__": mcp.run()` entrypoint.

**`.mcp.json` addition** (project root, committed):
```json
{
  "mcpServers": {
    "dealfinder": {
      "command": "python",
      "args": ["-m", "dealfinder.mcp_server"],
      "cwd": "companions/dealfinder"
    }
  }
}
```

**No changes** to `score.py`, `search.py`, `recommend.py`, or `snapshot.py`.

---

## 7. Animations

**Animation 1 — REUSE `MCPPrimitives`**, re-themed to electronics.
The three cards already use DealFinder tool names (`score_deal`, `search_deals`,
the resource URI pattern). Update the `ex` strings to use the electronics hero
cast: Tools card shows `score_deal("Sony XM5", 162.97)`, Resources card shows
`dealfinder://catalog/stats`, Prompts card shows `find_a_deal("headphones", 100)`.
Makes the three-primitive taxonomy (model-controlled / app-controlled /
user-controlled) concrete before any code appears.

**Animation 2 — REUSE `MCPBridge`**, already wired for electronics.
The component already shows `['Claude Code', 'Claude Desktop', 'any MCP client']`
connecting through the MCP bar to a DealFinder server with `score_deal()`,
`recommend()`, `search_deals()`. No re-theming needed. Place it after the
"One protocol, many clients" concept beat to make the multiplexing visible.

---

## 8. Teaching beats

1. **Concept — why MCP, not just an API:** the agent in Part 11 had tools as
   Python callables. MCP promotes those to a protocol any client understands —
   same tools, zero per-client glue. Show `MCPPrimitives` here.

2. **Concept — the three primitives:** Tools (model-controlled, side-effectful),
   Resources (app-controlled, read-only data), Prompts (user-controlled templates).
   Each exists for a reason; none is a catch-all.

3. **Code — install and init:** `pip install mcp[fastmcp]`; one `FastMCP` object;
   `stdio` transport (works with Claude Code out of the box).

4. **Code — register the tools:** decorate `score_deal`, `search_deals`,
   `recommend` with `@mcp.tool()`. Show that the docstring and the Pydantic
   input model become the schema the model sees — precision here determines how
   well the model fills arguments.

5. **Proof — tool call (hero cast):** run the server locally (`python -m
   dealfinder.mcp_server`), call `score_deal` with the Sony XM5 at $162.97.
   Confirm `deal_pct ≈ 0%`, `verdict: "fair price"`. Call with the Bose QC 45 at
   $46 — show the two signals diverge and the verdict warns.

6. **Code — resource:** decorate a function returning the snapshot summary dict
   at `dealfinder://catalog/stats`. Explain app-controlled = the server decides
   what's there; the model can read it but cannot mutate it.

7. **Code — prompt template:** `@mcp.prompt("find_a_deal")` with `query` and
   `budget` args; return the interpolated user message. Show that prompts let
   non-technical users invoke complex workflows with a named shortcut.

8. **Code — wire `.mcp.json`:** add the server to the project's `.mcp.json`.
   Open Claude Code; the DealFinder tools appear in the tool list. Run
   `find_a_deal("noise cancelling headphones", 100)` interactively — model
   self-selects `score_deal` and `search_deals` to answer.

9. **Proof — end-to-end session:** show the Claude Code transcript scoring the
   Anker Q20i ("strong deal") and flagging the Bose QC 45 ("verify condition"),
   entirely via the MCP interface.

---

## 9. Cross-references

**Back:** Part 11 (The agent) built the ReAct loop and defined `score_deal`,
`search_deals`, and `recommend` as Python callables inside the agent. Part 12
promotes exactly those callables to MCP tools — the same logic, now accessible to
any client without bespoke integration code.

**Forward:** Part 13 (pgvector persistence + semantic search over live deals)
introduces a live-data backend; the `search_deals` MCP tool will be updated there
to query the pgvector store instead of the frozen snapshot, making the server live
without changing its interface.

---

## 10. Reproducibility checks

```python
# tests/test_mcp_server.py — offline, snapshot-only, no MCP client needed

import importlib, json
from dealfinder.mcp_server import catalog_stats, find_a_deal_prompt

def test_catalog_stats_shape():
    stats = catalog_stats()
    assert stats["total"] == 270
    assert stats["queries"] == 18
    assert stats["categories"] == 11
    assert abs(stats["anchor_median"] - 162.97) < 0.01

def test_find_a_deal_prompt_contains_query():
    msg = find_a_deal_prompt("noise cancelling headphones", 100)
    assert "noise cancelling headphones" in msg
    assert "100" in msg

def test_score_deal_xm5_fair_price():
    from dealfinder.score import score_deal
    result = score_deal(
        "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        162.97, "audio"
    )
    assert abs(result["deal_pct"]) < 5.0  # within 5% of median

def test_score_deal_bose_trap_signals_diverge():
    from dealfinder.score import score_deal
    result = score_deal(
        "Bose QuietComfort 45 Bluetooth Wireless Headphones",
        46.00, "audio"
    )
    assert result["deal_pct"] > 60.0        # median says great deal
    assert result["model_residual"] < -50.0  # model says implausible
```

**Anchor median pin:** `catalog_stats()["anchor_median"]` must equal `162.97`
(derived from the committed snapshot; test asserts within $0.01).

---

## 11. Risks / notes

- **`mcp` package version:** `fastmcp` API stabilised in `mcp>=1.0`; pin
  `mcp>=1.0,<2` in `pyproject.toml`. The part notes which version the step tag
  was authored against.

- **stdio transport only:** Claude Code's `.mcp.json` uses `stdio` (subprocess
  stdin/stdout). HTTP/SSE transport is available in `FastMCP` but is not shown
  here — Part 14 (web app) introduces SSE streaming in a different context. The
  tutorial calls out that `mcp.run(transport="stdio")` is the right default for
  local tooling.

- **No live API calls:** all tool responses in this part are computed from the
  frozen snapshot. The tutorial is explicit that `search_deals` returns
  snapshot-backed results in this part and will switch to the live pgvector store
  in Part 13 — learners are not surprised when behavior changes.

- **`.mcp.json` path sensitivity:** the `cwd` must point to the companion root
  where `dealfinder/` is importable. The tutorial includes a troubleshooting note:
  if Claude Code reports "server failed to start", check `python -m
  dealfinder.mcp_server` runs in the same directory manually.

- **Non-determinism in the interactive session (beat 8/9):** the Claude Code
  session transcript is illustrative, not a pinned golden. The reproducibility
  checks cover the underlying tool functions deterministically; the session
  walkthrough shows what *a* reasonable session looks like, not a byte-exact
  replay.
