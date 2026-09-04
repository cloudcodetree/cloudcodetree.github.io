# Part 27 — Front end for real (React/Next, state, a11y, SSE streaming)

**Phase:** P6 — Full-stack SaaS
**Data mode:** LIVE
**Bible note:** (none)

---

## 1. Objective

Replace the Vanilla JS single-file UI from Part 14 with a production-quality Next.js (App Router) front end that manages search state with React hooks, streams SSE deal results into a live-updating card grid, and meets WCAG 2.1 AA accessibility requirements.

---

## 2. Prerequisites

- Part 14 — The web app (search UI, live/semantic toggle, SSE streaming): established `/search/stream` SSE endpoint, `render_badge()`, Vanilla JS baseline being replaced here
- Part 22 — Serve it fast & cheap (FastAPI, semantic cache, batching): `/search`, `/semantic`, `/batch-deals` endpoints in production shape
- Part 24 — Containerize & ship (Docker, CI/CD, IaC/Terraform): containers split front end from API; CORS and env config introduced here
- Part 25 — Cloud & Kubernetes (managed Postgres, secrets mgmt): the API now runs at a stable base URL exposed via env var

---

## 3. By the end, the learner can…

- Scaffold a Next.js 15 (App Router) front end with TypeScript that talks to the DealFinder FastAPI backend over a configurable `NEXT_PUBLIC_API_BASE_URL`.
- Manage live SSE search state with `useReducer` + `useEffect` (open stream → accumulate cards → close on done/error) without any third-party state library.
- Render an accessible deal-card grid: keyboard-navigable, proper `aria-live="polite"` region for streamed results, focus management on query submit, correct colour-contrast ratios for the GREAT_DEAL / FAIR / SUSPICIOUS badges.
- Write integration tests with Playwright that assert the hero-cast cards appear and the SUSPICIOUS badge fires on the Bose QC45 card — against a mocked SSE fixture, no live API required in CI.
- Explain why the Vanilla JS baseline from Part 14 does not scale to the auth/accounts/payments features in Parts 28–30 and what React's component model buys in that context.

---

## 4. Data

**Mode:** LIVE — the Next.js app talks to the running FastAPI backend. The frozen snapshot (`companions/dealfinder/data/snapshots/electronics-2026-07.json`, 270 items, 18 queries) backs the API's search index.

**Endpoints consumed:**
- `GET /search/stream?q=<query>` (SSE, text/event-stream) — the primary data path
- `GET /semantic?q=<query>&k=<n>` — semantic mode toggle (JSON, from Part 22 cache)
- `GET /healthz` — startup probe shown in the Docker Compose `depends_on` example

**Quoted numbers (all reproducible from snapshot or running app):**
- Snapshot median for "noise cancelling headphones": **$162.97**
- Hero-cast price points: Anker Q20i $44.99, Sony XM5 $162.97, Bose QC45 $46.00, Sony XM6 $399.99
- SSE stream: typically 2–3 `data:` source events + 1 `done` event before UI stabilises (~800–1200 ms end-to-end with circuit breaker)
- Playwright mock SSE fixture: 3 events, 17 deduplicated items returned (matches Part 14's `deduped: 17` figure for the hero query)

---

## 5. Worked example

**Query:** "noise cancelling headphones" — typed into the search box and submitted.

**State machine walkthrough (React):**
1. `dispatch({ type: 'SEARCH_START', query })` — clears cards, sets `status: 'streaming'`, opens `new EventSource('/api/search/stream?q=noise+cancelling+headphones')`.
2. `onmessage` fires for source batch 1: `{"source": "google_shopping", "count": 12, "elapsed_ms": 340}`. `dispatch({ type: 'BATCH_RECEIVED', items: [...] })` — Anker Q20i ($44.99, `GREAT_DEAL`) and Sony XM5 ($162.97, `FAIR`) cards appear. `aria-live="polite"` region announces "12 results loaded."
3. `onmessage` fires for batch 2: `{"source": "bestbuy_scraper", "count": 8, "elapsed_ms": 890}` — Bose QC45 ($46.00, `SUSPICIOUS`) card appears with warning badge.
4. `onmessage` fires: `{"done": true, "total": 20, "deduped": 17}` — stream closed, `status: 'done'`, Sony XM6 ($399.99) visible.

**A11y detail:** The search input has `aria-label="Search for deals"`. The submit button shows a spinner with `aria-label="Searching…"` during streaming. Each deal card is a `<article>` with `aria-labelledby` pointing to the title `<h3>`. The SUSPICIOUS badge has `role="status"` and text "Suspicious price — verify condition." Colour contrast on the green GREAT_DEAL badge: foreground `#14532d` on `#bbf7d0` = 7.2:1 (passes AA Large + AA Normal).

**Semantic toggle:** Clicking "Semantic" dispatches `{ type: 'MODE_TOGGLE', mode: 'semantic' }` — the next submit hits `GET /semantic?q=…&k=20` (JSON, not SSE). Results load as a single batch; the same card component renders both paths. Sony XM6 surfaces even without "noise cancellation" in the query string.

---

## 6. Companion code

**Existing modules unchanged:** `dealfinder/api.py` (the SSE endpoint, static mount removed), `dealfinder/deal_score.py`, `dealfinder/cache.py`.

**Delta introduced in this part:**

- `frontend/` — new Next.js 15 (App Router) application at the repo root sibling to `dealfinder/`:
  - `frontend/app/page.tsx` — root route: `<SearchPage />`
  - `frontend/app/components/SearchBar.tsx` — controlled input + mode toggle + submit; keyboard: Enter submits, Escape clears
  - `frontend/app/components/DealCard.tsx` — renders one item (title, price, badge, source logo placeholder); `<article>` with correct ARIA
  - `frontend/app/components/DealGrid.tsx` — `aria-live="polite"` region wrapping card list; announces count on each batch
  - `frontend/app/hooks/useSSESearch.ts` — `useReducer` + `useEffect` state machine (states: `idle | streaming | done | error`); handles `EventSource` lifecycle (open, message, error, close)
  - `frontend/app/hooks/useSemanticSearch.ts` — `useState` + `fetch` for the non-streaming semantic path
  - `frontend/playwright/search.spec.ts` — Playwright integration tests against a mocked SSE server fixture

- `dealfinder/api.py` — minor: remove `StaticFiles` mount (no longer serving the Vanilla JS); add CORS middleware (`fastapi.middleware.cors.CORSMiddleware`) allowing `http://localhost:3000` in dev and `FRONTEND_ORIGIN` env var in prod.

**Step tags:** `step-27` in `tutorial-dealfinder`. NEW part. Diff from `step-26` to `step-27` introduces the entire `frontend/` directory and the CORS addition to `api.py`.

---

## 7. Animations

**Animation 1 — REUSE `SSEStream`** (introduced in Part 14, new component there): re-use as-is — the pipe metaphor (server → browser, chunks flowing left-to-right, card stack growing on the right) already captures the core concept. Re-theme the chunk labels from the Part 14 generic labels to the hero-cast items: chunk 1 = "google_shopping · Anker Q20i $44.99 · Sony XM5 $162.97", chunk 2 = "bestbuy · Bose QC45 $46.00". The contrast with a greyed-out "wait for all" bar remains. Concept: SSE streams are unchanged by the React wrapper — the animation reassures learners that the protocol hasn't changed, only the consumer.

**Animation 2 — NEW `Stateмашine` (`SearchStateMachine.tsx`):** Visual metaphor: four rounded rectangles arranged in a directed graph — `idle → streaming → done` (happy path) and `streaming → error` (circuit-breaker path). Each state box shows the React state slice it owns (`cards: []`, `status`, `query`). Animated transitions: a labelled arrow pulses along the active edge when the tutorial's prose reaches the corresponding dispatch call. A small `useReducer` action label (`SEARCH_START`, `BATCH_RECEIVED`, `DONE`, `ERROR`) floats along the arrow during the Framer Motion animation. Concept made visible: why `useReducer` (not `useState`) — state transitions are exhaustive and auditable, not scattered across multiple `setState` calls. Static-export-safe: all transitions are sequenced by a `step` prop; no runtime fetch.

---

## 8. Teaching beats

1. **Why rebuild?** Show the Vanilla JS `index.html` from Part 14. Count the lines that handle state: a dozen scattered `document.getElementById` mutations. Then show the auth token header that Part 28 will need on every request — you'd have to thread it through six different DOM-mutation sites. React's component model handles this in one prop. Motivation delivered.
2. **Scaffold.** `npx create-next-app@15 frontend --typescript --app --tailwind --no-src-dir`. Walk the generated structure; delete the boilerplate; add `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` to `.env.local`.
3. **The state machine.** Introduce `useSSESearch.ts` — draw the state diagram (matches Animation 2). Explain why `useReducer`: the `streaming → done` and `streaming → error` transitions are concurrent; `useState` would require coordination.
4. **Wire `EventSource`.** Walk the `useEffect` hook: open `EventSource` on `query` change, add `onmessage` / `onerror` handlers, return cleanup that calls `source.close()`. Show the browser DevTools → Network → EventStream panel streaming the three hero-cast source events.
5. **Deal card + badges.** Build `DealCard.tsx` from the `render_badge()` thresholds pinned in Part 14. Show the Bose QC45 SUSPICIOUS card appearing with its warning message.
6. **A11y.** Add `aria-live="polite"` to `DealGrid`. Audit with `axe-core` via `@axe-core/playwright` in the Playwright test. Show zero violations. Check the GREAT_DEAL badge contrast with the browser DevTools colour picker (7.2:1).
7. **CORS & env config.** Add `CORSMiddleware` to `api.py`. Show the browser console CORS error without it, then the fix. Explain `NEXT_PUBLIC_API_BASE_URL` vs. server-side env vars — public prefix is required for client components.
8. **Proof.** `npx playwright test` — green. Three assertions: hero-cast cards appear, SUSPICIOUS badge fires on Bose QC45, `aria-live` region is present.

---

## 9. Cross-references

**Back:** Part 14 (The web app) established the SSE endpoint and Vanilla JS baseline that this part replaces — the endpoint contract (`/search/stream`, `text/event-stream`, source-batch + done events) is unchanged. Learners should read Part 14's risk note on the deliberate simplification before starting here.

**Forward:** Part 28 (Auth & accounts — Supabase Auth, RBAC) threads a JWT into every API request and adds a login/signup flow — both require the React component tree built in this part; specifically, a context provider wrapping `layout.tsx` and `fetch` calls updated in `useSSESearch.ts` to include `Authorization: Bearer <token>`.

---

## 10. Reproducibility checks

```typescript
// frontend/playwright/search.spec.ts
import { test, expect } from '@playwright/test';

// Mock SSE fixture: 3 events matching Part 14's hero-query response shape
test.beforeEach(async ({ page }) => {
  await page.route('**/search/stream*', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body: [
        'data: {"source":"google_shopping","count":12,"elapsed_ms":340,"items":[{"title":"Sony WH-1000XM5","price":162.97,"deal_pct":0.0,"badge":"FAIR"},{"title":"Anker Soundcore Q20i","price":44.99,"deal_pct":0.72,"badge":"GREAT_DEAL"}]}\n\n',
        'data: {"source":"bestbuy_scraper","count":5,"elapsed_ms":890,"items":[{"title":"Bose QuietComfort 45","price":46.0,"deal_pct":0.72,"badge":"SUSPICIOUS"}]}\n\n',
        'data: {"done":true,"total":20,"deduped":17}\n\n',
      ].join(''),
    });
  });
});

test('hero cast cards appear after SSE stream', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search for deals').fill('noise cancelling headphones');
  await page.getByRole('button', { name: /search/i }).click();
  await expect(page.getByText('Anker Soundcore Q20i')).toBeVisible();
  await expect(page.getByText('$44.99')).toBeVisible();
  await expect(page.getByText('Sony WH-1000XM5')).toBeVisible();
  await expect(page.getByText('$162.97')).toBeVisible();
});

test('SUSPICIOUS badge fires on Bose QC45', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search for deals').fill('noise cancelling headphones');
  await page.getByRole('button', { name: /search/i }).click();
  await expect(page.getByText('Bose QuietComfort 45')).toBeVisible();
  await expect(page.getByText(/suspicious/i).first()).toBeVisible();
});

test('aria-live region is present', async ({ page }) => {
  await page.goto('/');
  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).toBeAttached();
});
```

The mock SSE fixture uses the exact hero-cast prices from the frozen snapshot (Anker $44.99, Sony XM5 $162.97, Bose $46.00, median $162.97). The `deduped: 17` count matches Part 14's worked example — a consistent figure across the two parts.

---

## 11. Risks / notes

- **No live API required in CI.** All Playwright tests use the mock SSE route handler. The tutorial's live-demo section requires `NEXT_PUBLIC_API_BASE_URL` pointing to a running `uvicorn dealfinder.api:app` instance, but this is gated with a `<Callout type="prereq">`.
- **`EventSource` and React Strict Mode.** React 18+ Strict Mode double-invokes effects in development. The `useSSESearch.ts` cleanup function (`source.close()`) must be idempotent — closing an already-closed `EventSource` is a no-op per spec. The tutorial explicitly shows this and runs Strict Mode on in dev.
- **Safari `EventSource` reconnect.** Same risk as Part 14: the part uses one `EventSource` per query submission (not a persistent connection), so the reconnect edge case does not apply. Noted in a `<Callout type="warning">`.
- **CORS in production.** The tutorial configures `FRONTEND_ORIGIN` as an env var on the API container. Hardcoding `localhost:3000` for dev is intentional; the production origin comes from Part 25's Kubernetes secret. A `<Callout type="info">` cross-references Part 24's Docker Compose file where `FRONTEND_ORIGIN` is first defined.
- **Tailwind purge.** Badge colour classes (`bg-green-100 text-green-900`, `bg-yellow-100 text-yellow-900`, `bg-red-100 text-red-900`) must be in the `content` glob or added to `safelist` in `tailwind.config.ts` — the tutorial shows both options and recommends `safelist` for programmatically-selected badge styles.
- **No GPU, no external cost.** The front end makes no LLM calls. The semantic endpoint hits the FastAPI semantic cache (Part 22), which is warmed from the frozen snapshot embeddings — zero OpenAI cost for the tutorial demo after warmup.
