# DealFinder Part 1 — Data Layer & Connectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build DealFinder's data layer — a pluggable `DealSource` connector library (dataset + live-API + scraper) that normalizes any source into one `Product` schema, dedups across sources, and persists to a local store — then publish the Part 1 tutorial.

**Architecture:** A small Python package (`dealfinder/`) in the companion repo `tutorial-dealfinder`. A `Product` pydantic model is the common schema. A `DealSource` Protocol has three implementations behind one interface; an `ingest()` pipeline merges + dedups their output into SQLite. Tests use fixtures/mocks (no live network). The site tutorial (MDX) links the repo's per-step git tags.

**Tech Stack:** Python 3.11, pydantic v2, pandas (EDA only), httpx (API), selectolax (scrape parse), pytest + respx (mocked HTTP), ruff. Companion repo built with one git tag per step. Site: existing `create-tutorial` skill + `scaffold-tutorial.mjs`.

## Global Constraints

- Companion repo: its own independent repo `cloudcodetree/tutorial-dealfinder` (Python
  3.11, one annotated git tag per step `step-01` …, `main` = finished), **wired into the
  site repo as a git submodule at `companions/dealfinder/`** for local dev/testing.
  **Private until launch.** The deploy workflow checks out with `submodules: false`, so the
  public static build never needs it. Submodule wiring lives on the `draft/dealfinder`
  branch; site `main` stays clean until launch.
- **Dev/test environment is a devcontainer (Python 3.11).** The committed
  `companions/dealfinder/.devcontainer/` powers VS Code Dev Containers + "Open in
  Codespaces" (a planned course feature). Host Python is irrelevant. Locally, the
  test loop runs inside a `python:3.11` container via `docker exec` (fast iteration);
  CI runs the same tests in 3.11. `requires-python = ">=3.11"`.
- **Verified tutorial:** every code block + output shown in the MDX must come from a real run. No fabricated output.
- Tests must be deterministic and offline: live-API and scraper connectors are tested against recorded fixtures/mocks, never the network.
- The reproducible **dataset connector is the spine**; API + scraper are additional connectors. Dataset lives in the repo (`data/sample/`).
- `Product` schema fields are fixed (see Task 2) and reused by every later part — do not rename.
- Site series name: **"DealFinder — AI Engineering"**; Part 1 slug: `dealfinder-data-layer`.
- **Publish gate (hard):** no part goes live until the user has personally worked
  through it. Build the tutorial + companion code on a branch, preview locally
  (`pnpm dev` → `localhost:3000/tutorials/<slug>`), and have the user run the
  companion repo end to end. Publish (merge/push to `main`) ONLY on their sign-off.
  The companion GitHub repo is created **private** until launch.

---

### Task 1: Scaffold the companion repo + tooling

**Files:**
- Create: `tutorial-dealfinder/pyproject.toml`, `tutorial-dealfinder/README.md`, `tutorial-dealfinder/dealfinder/__init__.py`, `tutorial-dealfinder/tests/__init__.py`, `tutorial-dealfinder/.gitignore`

**Interfaces:**
- Produces: an installable package `dealfinder` with `pytest` + `ruff` configured.

- [ ] **Step 1: Create the companion repo as a submodule of the site repo**

```bash
# in the SITE repo
git checkout -b draft/dealfinder
gh repo create cloudcodetree/tutorial-dealfinder --private \
  --description "Companion code for the DealFinder AI-engineering tutorial series"   # outward; confirm first
git submodule add git@github.com:cloudcodetree/tutorial-dealfinder.git companions/dealfinder
cd companions/dealfinder
mkdir -p dealfinder tests data/sample data/fixtures .devcontainer
```

Write `.devcontainer/devcontainer.json`:

```json
{
  "name": "DealFinder",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "postCreateCommand": "pip install -e '.[dev]'",
  "customizations": { "vscode": { "extensions": ["ms-python.python", "charliermarsh.ruff"] } }
}
```

Start a long-lived dev container for the local TDD loop (real Python 3.11, fast iteration):

```bash
docker run -d --name df-dev -v "$PWD":/work -w /work python:3.11-slim sleep infinity
docker exec df-dev pip install -e ".[dev]"
# each test run:  docker exec df-dev pytest -q
```

All remaining Task-N steps run **inside `companions/dealfinder/`** (its own repo), tests via
`docker exec df-dev pytest`; the site repo only records the submodule pointer (Task 8) on
`draft/dealfinder`.

- [ ] **Step 2: Write `pyproject.toml`**

```toml
[project]
name = "dealfinder"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["pydantic>=2.6", "httpx>=0.27", "selectolax>=0.3", "pandas>=2.2"]

[project.optional-dependencies]
dev = ["pytest>=8", "respx>=0.21", "ruff>=0.5"]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
```

- [ ] **Step 3: Verify tooling in the container**

Run: `docker exec df-dev pytest -q`  (all later `pytest` runs use this `docker exec df-dev …` form)
Expected: `no tests ran` (exit 0) — tooling works.

- [ ] **Step 4: Commit + tag**

```bash
git add -A && git commit -m "step 1: package scaffold + tooling"
git tag -a step-01 -m "Step 1 - package scaffold and tooling"
```

---

### Task 2: The `Product` schema (common normalized shape)

**Files:**
- Create: `dealfinder/schema.py`
- Test: `tests/test_schema.py`

**Interfaces:**
- Produces: `class PricePoint(BaseModel)` with `day: date`, `price: float`; `class Product(BaseModel)` with fields `id: str`, `title: str`, `brand: str | None`, `category: str`, `price: float`, `currency: str = "USD"`, `url: str`, `source: str`, `image_url: str | None = None`, `specs: dict[str, str] = {}`, `price_history: list[PricePoint] = []`. Consumed by every connector and later part.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_schema.py
from datetime import date
from dealfinder.schema import Product, PricePoint

def test_product_requires_core_fields_and_defaults():
    p = Product(id="x1", title="Tent", brand="TrailLite", category="tents",
                price=189.0, url="https://ex/x1", source="dataset")
    assert p.currency == "USD" and p.specs == {} and p.price_history == []

def test_price_history_typed():
    p = Product(id="x1", title="t", brand=None, category="c", price=1.0,
                url="u", source="dataset", price_history=[{"day": "2026-06-01", "price": 9.0}])
    assert p.price_history[0] == PricePoint(day=date(2026, 6, 1), price=9.0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_schema.py -q`
Expected: FAIL — `ModuleNotFoundError: dealfinder.schema`

- [ ] **Step 3: Write minimal implementation**

```python
# dealfinder/schema.py
from datetime import date
from pydantic import BaseModel

class PricePoint(BaseModel):
    day: date
    price: float

class Product(BaseModel):
    id: str
    title: str
    brand: str | None
    category: str
    price: float
    currency: str = "USD"
    url: str
    source: str
    image_url: str | None = None
    specs: dict[str, str] = {}
    price_history: list[PricePoint] = []
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_schema.py -q`  → Expected: 2 passed

- [ ] **Step 5: Commit + tag**

```bash
git add -A && git commit -m "step 2: Product common schema"
git tag -a step-02 -m "Step 2 - Product schema"
```

---

### Task 3: `DealSource` protocol + dataset connector

**Files:**
- Create: `dealfinder/sources.py`, `data/sample/products.json`
- Test: `tests/test_dataset_source.py`

**Interfaces:**
- Consumes: `Product` (Task 2).
- Produces: `class DealSource(Protocol)` with `name: str` and `def products(self) -> Iterator[Product]`. `class DatasetSource(path: str)` implementing it.

- [ ] **Step 1: Create a tiny deterministic dataset**

```json
[
  {"sku":"traillite-ul2","name":"TrailLite UL2 Tent","make":"TrailLite","cat":"tents",
   "usd":189.0,"link":"https://ex/traillite-ul2","weight_kg":"1.1","capacity":"2",
   "history":[["2026-04-01",249.0],["2026-05-01",245.0],["2026-06-01",189.0]]},
  {"sku":"cloudpeak-2p","name":"CloudPeak 2P","make":"CloudPeak","cat":"tents",
   "usd":215.0,"link":"https://ex/cloudpeak-2p","weight_kg":"1.4","capacity":"2",
   "history":[["2026-05-01",229.0],["2026-06-01",215.0]]}
]
```

- [ ] **Step 2: Write the failing test**

```python
# tests/test_dataset_source.py
from dealfinder.sources import DatasetSource

def test_dataset_source_normalizes():
    items = list(DatasetSource("data/sample/products.json").products())
    p = next(i for i in items if i.id == "traillite-ul2")
    assert p.source == "dataset" and p.brand == "TrailLite" and p.price == 189.0
    assert p.specs["weight_kg"] == "1.1"
    assert p.price_history[-1].price == 189.0
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_dataset_source.py -q` → Expected: FAIL — `cannot import name 'DatasetSource'`

- [ ] **Step 4: Write minimal implementation**

```python
# dealfinder/sources.py
import json
from typing import Iterator, Protocol, runtime_checkable
from dealfinder.schema import Product, PricePoint

@runtime_checkable
class DealSource(Protocol):
    name: str
    def products(self) -> Iterator[Product]: ...

class DatasetSource:
    name = "dataset"
    def __init__(self, path: str): self.path = path
    def products(self) -> Iterator[Product]:
        for r in json.loads(open(self.path).read()):
            yield Product(
                id=r["sku"], title=r["name"], brand=r.get("make"), category=r["cat"],
                price=r["usd"], url=r["link"], source=self.name,
                specs={k: str(v) for k, v in r.items() if k in ("weight_kg", "capacity")},
                price_history=[PricePoint(day=d, price=p) for d, p in r.get("history", [])],
            )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_dataset_source.py -q` → Expected: 1 passed

- [ ] **Step 6: Commit + tag**

```bash
git add -A && git commit -m "step 3: DealSource protocol + dataset connector"
git tag -a step-03 -m "Step 3 - dataset connector"
```

---

### Task 4: Live-API connector (mocked in tests)

**Files:**
- Modify: `dealfinder/sources.py`
- Create: `tests/test_api_source.py`

**Interfaces:**
- Produces: `class ApiSource(base_url: str, api_key: str)` implementing `DealSource` (`name = "api"`), fetching JSON over httpx and normalizing to `Product`.

- [ ] **Step 1: Write the failing test (mock HTTP with respx)**

```python
# tests/test_api_source.py
import respx, httpx
from dealfinder.sources import ApiSource

@respx.mock
def test_api_source_normalizes():
    respx.get("https://api.test/search").mock(return_value=httpx.Response(200, json={
        "items": [{"id": "abc", "title": "Widget", "brand": "Acme",
                   "category": "misc", "price": 12.5, "url": "https://ex/abc"}]}))
    items = list(ApiSource("https://api.test", "k").products())
    assert items[0].id == "abc" and items[0].source == "api" and items[0].price == 12.5
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_api_source.py -q` → Expected: FAIL — `cannot import name 'ApiSource'`

- [ ] **Step 3: Write minimal implementation (append to sources.py)**

```python
import httpx

class ApiSource:
    name = "api"
    def __init__(self, base_url: str, api_key: str):
        self.base_url, self.api_key = base_url.rstrip("/"), api_key
    def products(self) -> Iterator[Product]:
        r = httpx.get(f"{self.base_url}/search",
                      headers={"Authorization": f"Bearer {self.api_key}"})
        r.raise_for_status()
        for it in r.json()["items"]:
            yield Product(id=it["id"], title=it["title"], brand=it.get("brand"),
                          category=it["category"], price=it["price"], url=it["url"],
                          source=self.name)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_api_source.py -q` → Expected: 1 passed

- [ ] **Step 5: Commit + tag**

```bash
git add -A && git commit -m "step 4: live-API connector (mocked tests)"
git tag -a step-04 -m "Step 4 - API connector"
```

---

### Task 5: Scraper connector (parses a saved fixture; robots-aware)

**Files:**
- Modify: `dealfinder/sources.py`
- Create: `data/fixtures/listing.html`, `tests/test_scraper_source.py`

**Interfaces:**
- Produces: `class ScraperSource(html_paths: list[str], source_url: str)` implementing `DealSource` (`name = "scrape"`); parses local HTML into `Product`. (Live fetching + robots.txt is documented in the tutorial, not exercised in tests.)

- [ ] **Step 1: Create the HTML fixture**

```html
<!-- data/fixtures/listing.html -->
<div class="product" data-id="rr2" data-price="232.00">
  <h2 class="title">RidgeRunner 2 Ultralight</h2>
  <span class="brand">RidgeRunner</span>
</div>
```

- [ ] **Step 2: Write the failing test**

```python
# tests/test_scraper_source.py
from dealfinder.sources import ScraperSource

def test_scraper_parses_fixture():
    items = list(ScraperSource(["data/fixtures/listing.html"], "https://shop.ex").products())
    p = items[0]
    assert p.id == "rr2" and p.brand == "RidgeRunner" and p.price == 232.0 and p.source == "scrape"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_scraper_source.py -q` → Expected: FAIL — `cannot import name 'ScraperSource'`

- [ ] **Step 4: Write minimal implementation (append to sources.py)**

```python
from selectolax.parser import HTMLParser

class ScraperSource:
    name = "scrape"
    def __init__(self, html_paths: list[str], source_url: str):
        self.html_paths, self.source_url = html_paths, source_url
    def products(self) -> Iterator[Product]:
        for path in self.html_paths:
            tree = HTMLParser(open(path).read())
            for node in tree.css("div.product"):
                yield Product(
                    id=node.attributes["data-id"],
                    title=node.css_first("h2.title").text(strip=True),
                    brand=node.css_first("span.brand").text(strip=True),
                    category="unknown",
                    price=float(node.attributes["data-price"]),
                    url=self.source_url, source=self.name)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_scraper_source.py -q` → Expected: 1 passed

- [ ] **Step 6: Commit + tag**

```bash
git add -A && git commit -m "step 5: scraper connector (fixture-parsed)"
git tag -a step-05 -m "Step 5 - scraper connector"
```

---

### Task 6: Ingest pipeline — merge + dedup across sources

**Files:**
- Create: `dealfinder/ingest.py`
- Test: `tests/test_ingest.py`

**Interfaces:**
- Consumes: `DealSource`, `Product`.
- Produces: `def dedup_key(p: Product) -> str` (normalized `brand|title`); `def ingest(sources: list[DealSource]) -> list[Product]` — merges all products, dedups by `dedup_key` keeping the **lowest current price**, returns newest-first by nothing specific (stable). 

- [ ] **Step 1: Write the failing test (use a fake source)**

```python
# tests/test_ingest.py
from dealfinder.schema import Product
from dealfinder.ingest import ingest, dedup_key

class Fake:
    name = "fake"
    def __init__(self, products): self._p = products
    def products(self): return iter(self._p)

def _p(id, price, brand="Acme", title="Tent", source="fake"):
    return Product(id=id, title=title, brand=brand, category="tents",
                   price=price, url=f"https://ex/{id}", source=source)

def test_dedup_keeps_cheapest_across_sources():
    a = Fake([_p("a", 200, source="dataset")])
    b = Fake([_p("b", 180, source="api")])  # same brand+title, cheaper
    out = ingest([a, b])
    assert len(out) == 1 and out[0].price == 180.0

def test_distinct_products_kept():
    out = ingest([Fake([_p("a", 200, title="Tent"), _p("c", 50, title="Pad")])])
    assert {p.title for p in out} == {"Tent", "Pad"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingest.py -q` → Expected: FAIL — `ModuleNotFoundError: dealfinder.ingest`

- [ ] **Step 3: Write minimal implementation**

```python
# dealfinder/ingest.py
from dealfinder.schema import Product
from dealfinder.sources import DealSource

def dedup_key(p: Product) -> str:
    return f"{(p.brand or '').strip().lower()}|{p.title.strip().lower()}"

def ingest(sources: list[DealSource]) -> list[Product]:
    best: dict[str, Product] = {}
    for src in sources:
        for p in src.products():
            k = dedup_key(p)
            if k not in best or p.price < best[k].price:
                best[k] = p
    return list(best.values())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ingest.py -q` → Expected: 2 passed

- [ ] **Step 5: Commit + tag**

```bash
git add -A && git commit -m "step 6: ingest + cross-source dedup"
git tag -a step-06 -m "Step 6 - ingest and dedup"
```

---

### Task 7: Persist to SQLite + a one-command pipeline

**Files:**
- Create: `dealfinder/store.py`, `dealfinder/run_ingest.py`
- Test: `tests/test_store.py`

**Interfaces:**
- Consumes: `Product`, `ingest`.
- Produces: `def save(products: list[Product], db_path: str) -> int` (rows written); `def load(db_path: str) -> list[Product]`. `run_ingest.py` wires DatasetSource (+ optional API/scrape) → ingest → save.

- [ ] **Step 1: Write the failing test (round-trip)**

```python
# tests/test_store.py
from dealfinder.schema import Product
from dealfinder.store import save, load

def _p(id): return Product(id=id, title="Tent", brand="Acme", category="tents",
                           price=10.0, url="u", source="dataset")

def test_save_load_roundtrip(tmp_path):
    db = str(tmp_path / "d.sqlite")
    assert save([_p("a"), _p("b")], db) == 2
    got = {p.id for p in load(db)}
    assert got == {"a", "b"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_store.py -q` → Expected: FAIL — `ModuleNotFoundError: dealfinder.store`

- [ ] **Step 3: Write minimal implementation**

```python
# dealfinder/store.py
import sqlite3
from dealfinder.schema import Product

def save(products: list[Product], db_path: str) -> int:
    con = sqlite3.connect(db_path)
    con.execute("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, json TEXT)")
    con.executemany("INSERT OR REPLACE INTO products VALUES (?, ?)",
                    [(p.id, p.model_dump_json()) for p in products])
    con.commit(); n = con.total_changes; con.close()
    return n

def load(db_path: str) -> list[Product]:
    con = sqlite3.connect(db_path)
    rows = con.execute("SELECT json FROM products").fetchall(); con.close()
    return [Product.model_validate_json(r[0]) for r in rows]
```

```python
# dealfinder/run_ingest.py
from dealfinder.sources import DatasetSource
from dealfinder.ingest import ingest
from dealfinder.store import save

if __name__ == "__main__":
    products = ingest([DatasetSource("data/sample/products.json")])
    n = save(products, "dealfinder.sqlite")
    print(f"ingested {len(products)} products -> dealfinder.sqlite ({n} rows)")
```

- [ ] **Step 4: Run tests + the pipeline**

Run: `pytest -q && python -m dealfinder.run_ingest`
Expected: all pass; prints `ingested 2 products -> dealfinder.sqlite (2 rows)`

- [ ] **Step 5: Commit + tag**

```bash
git add -A && git commit -m "step 7: SQLite store + run_ingest pipeline"
git tag -a step-07 -m "Step 7 - store + pipeline"
```

---

### Task 8: README step table + push the repo

**Files:**
- Modify: `tutorial-dealfinder/README.md`

- [ ] **Step 1: Write the README** (quickstart + step compare table)

```markdown
# DealFinder — Data Layer

Companion code for [cloudcodetree.com/tutorials/dealfinder-data-layer](https://cloudcodetree.com/tutorials/dealfinder-data-layer/).

```bash
git clone https://github.com/cloudcodetree/tutorial-dealfinder && cd tutorial-dealfinder
python3.11 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]" && pytest -q
git checkout step-02   # then step-03 …
```

| Step | What you add |
|---|---|
| `step-01` | Package scaffold + tooling |
| `step-02` | `Product` common schema |
| `step-03` | `DealSource` + dataset connector |
| `step-04` | Live-API connector |
| `step-05` | Scraper connector |
| `step-06` | Ingest + dedup |
| `step-07` | SQLite store + pipeline |

`main` is the finished version.
```

- [ ] **Step 2: Push the companion repo + record the submodule pointer**

```bash
# inside companions/dealfinder (its own repo; created private in Task 1)
git add -A && git commit -m "step 8: README + step table"
git push -u origin main && git push origin --tags

# back in the SITE repo on draft/dealfinder — record the submodule at this commit
cd ../..
git add .gitmodules companions/dealfinder
git commit -m "chore: add DealFinder companion submodule (draft)"
```

Verify `.github/workflows/deploy.yml` does NOT set `submodules: true` on checkout (default is
false — the public build must not require the private companion). Flip the companion public at
launch after sign-off: `gh repo edit cloudcodetree/tutorial-dealfinder --visibility public`.

---

### Task 9: New cover series style

**Files:**
- Modify: `scripts/generate-tutorial-covers.mjs` (in the SITE repo)

**Interfaces:**
- Consumes: `SERIES_STYLE`, `GLYPHS` (existing).
- Produces: a `'DealFinder — AI Engineering'` entry with an accent + a `tag` glyph.

- [ ] **Step 1: Add a price-tag glyph + series style**

In `GLYPHS`, add:

```js
  tag: (a) => `<g transform="translate(900,300)" fill="none" stroke="${a}" stroke-width="6" opacity="0.45">
    <path d="M20,20 L120,20 L210,110 a14,14 0 0 1 0,20 L130,210 a14,14 0 0 1 -20,0 L20,120 Z"/>
    <circle cx="70" cy="70" r="12" fill="${a}"/></g>`,
```

In `SERIES_STYLE`, add:

```js
  'DealFinder — AI Engineering': { accent: '#0ea5e9', glyph: 'tag' },
```

- [ ] **Step 2: Commit (cover regenerates when the Part 1 entry exists, Task 10)**

```bash
git add scripts/generate-tutorial-covers.mjs
git commit -m "tutorials: add DealFinder series cover style"
```

---

### Task 10: Scaffold + write the Part 1 tutorial (verified)

**Files:**
- Create (via scaffolder): `app/tutorials/(article)/dealfinder-data-layer/page.mdx`, manifest entry, cover

**Interfaces:**
- Consumes: the create-tutorial skill, `scaffold-tutorial.mjs`, the companion repo's tested code + step tags.

- [ ] **Step 1: Scaffold**

```bash
node scripts/scaffold-tutorial.mjs dealfinder-data-layer \
  --series "DealFinder — AI Engineering" \
  --title "Build the Data Layer" --type verified \
  --excerpt "Ingest messy product/price data from a dataset, a live API, and a scraper behind one DealSource interface; normalize, dedup, and store it — the foundation of an AI deal-finder." \
  --tags "Tutorial,DealFinder,Data Engineering,Python"
```

- [ ] **Step 2: Write the MDX body** — follow the `create-tutorial` skill's hard rules. Use the **real** pytest/pipeline output captured while building the repo (e.g., `ingested 2 products …`, passing test counts). Link the companion repo + per-step compare URLs. Cover: the connector/adapter pattern, the common schema, dedup, the SQLite store. Add the "how this scales" callout (Spark/streaming/warehouse) per the spec.

- [ ] **Step 3: Build + verify**

Run: `pnpm run build`
Expected: compiles; `/tutorials/dealfinder-data-layer` exported; cover present at `public/tutorials/covers/dealfinder-data-layer.png`.

- [ ] **Step 4: Mobile/overflow spot check** — no horizontal overflow at 320px (code scrolls in `<pre>`).

- [ ] **Step 5: Commit to a draft branch (NOT main)**

```bash
git checkout -b draft/dealfinder-part1
git add app/tutorials public/tutorials/covers scripts/generate-tutorial-covers.mjs
git commit -m "draft: DealFinder Part 1 — data layer & connectors"
```

- [ ] **Step 6: Local preview for the author walkthrough**

Run: `pnpm run dev` → open `http://localhost:3000/tutorials/dealfinder-data-layer`.
Also walk the companion repo: `git clone … && pip install -e ".[dev]" && pytest -q` and
`git checkout step-02 … step-07`. Confirm the tutorial's shown output matches a real run.

- [ ] **Step 7: AUTHOR WALKTHROUGH GATE (hard stop)**

Hand off to the user. They work through the entire part (read the tutorial + run the
companion steps) and approve or request changes. **Do not proceed to Step 8 without sign-off.**

- [ ] **Step 8: Publish on sign-off only**

```bash
git checkout main && git merge --no-ff draft/dealfinder-part1
git push origin main          # rebase if the autonomous pipeline advanced
gh repo edit cloudcodetree/tutorial-dealfinder --visibility public
```

---

## Self-Review

- **Spec coverage (Part 1 = spec Phase 1, Part 1):** data layer ✓ (Tasks 2–7), three connectors behind one interface ✓ (Tasks 3–5), dedup/normalize ✓ (Task 6), dataset spine + reproducibility ✓ (Task 3), verified tutorial + companion step-tags ✓ (Tasks 8,10), new series cover ✓ (Task 9). *Deferred to their own plans (correctly out of Part 1):* data versioning (DVC) + EDA notebook — fold into Part 1's tutorial as an optional section or a Part 1.5; the LLM-internals primer (Part 2); all later phases.
- **Placeholders:** none — every code/test step has complete code and an exact command + expected output.
- **Type consistency:** `Product`/`PricePoint` fields, `DealSource.products()`, `ingest()`, `dedup_key()`, `save()/load()` names are consistent across Tasks 2–7 and the tests.

## Note on a convention extension

This is the first **multi-part series sharing one companion repo** (tags `step-01…` accrete across parts, not one repo per tutorial). Add a one-line note to the `create-tutorial` skill/playbook when this lands so future parts append tags to `tutorial-dealfinder` rather than scaffolding a new repo.
