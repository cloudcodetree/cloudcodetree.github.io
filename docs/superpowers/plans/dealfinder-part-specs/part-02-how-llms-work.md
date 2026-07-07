# Part 02 — How LLMs Actually Work (Literacy)

**Phase:** P1 | **Data mode:** CONCEPT | **Slug:** `dealfinder-how-llms-work`

---

## 1. Objective

The learner understands how a large language model tokenizes, attends, and
generates text, so that every LLM call in the course (extraction, agent
reasoning, semantic search) is demystified rather than magic.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot

---

## 3. By the end, the learner can…

- Explain tokenization and why "WH-1000XM5" may split into multiple tokens.
- Describe the attention mechanism without equations: what tokens "look at"
  what, and why that matters for long product titles.
- Distinguish temperature = 0 (extraction, deal scoring) from temperature > 0
  (brainstorming, summaries) and choose correctly.
- Predict roughly how many tokens a product title + prompt consume, and why
  context length limits matter for batch extraction over 270 items.
- Identify where non-determinism lives (sampling) versus where it does not
  (greedy/argmax at temp = 0).

---

## 4. Data

**Mode: CONCEPT.** No snapshot rows are loaded or quoted as training data.
The snapshot is referenced only as a real-world anchor to make abstract
concepts tangible:

- Snapshot stat used for illustration (no code run required): the snapshot
  contains 270 items; at ~40 tokens per title + prompt overhead, a single-pass
  extraction would consume roughly 270 × 40 = ~10,800 prompt tokens. This
  motivates batching and context-length awareness discussed in Part 6.
- Hero cast item used for tokenization demo: `"Sony WH-1000XM5 Wireless Noise
  Cancelling Headphones"` — a real title from the snapshot, used to show how
  a tokenizer splits a model-number string.
- No API calls, no snapshot reads, no metrics to reproduce. All values are
  illustrative and labeled as such.

---

## 5. Worked example

**Tokenization walkthrough.**
Input string: `"Sony WH-1000XM5 Wireless Noise Cancelling Headphones"`
Show in the `Tokenizer` animation that `WH-1000XM5` splits into tokens such
as `["WH", "-", "1000", "X", "M", "5"]` (6 tokens for one model number).
Contrast with `"Sony"` = 1 token. Point: structured identifiers are expensive
and can be misread if the model has never seen them. This matters in Part 6
when extracting `brand` from noisy titles like `"Walmart - COWIN E7 ANC"`.

**Attention walkthrough.**
Show a short sequence: `["Bose", "QuietComfort", "45", "@", "$46"]`.
The `AttentionView` animation highlights that `"$46"` attends strongly to
`"Bose"` and `"45"` — the model links price to product and model number.
This is why an LLM extractor can pull `price=46` and `model=QC45` from a
messy title, but also why it can hallucinate a `brand=Bose` when the actual
`brand` field in the snapshot says `"Target"` (the retailer). Sets up the
normalization problem from Part 1 and the extraction challenge in Part 6.

**Temperature demo.**
Two calls with the same prompt `"Is the Bose QC45 at $46 a genuine deal?"`:
- temp = 0 → deterministic: always returns the same structured JSON.
- temp = 0.9 → varied prose: sometimes says "possibly refurbished", sometimes
  "check seller rating". Illustrates why the deal-score pipeline locks temp = 0
  on the extraction step but a summarization agent might use temp = 0.7.

No live API calls are made in this part. The temperature demo is shown via
the `TemperatureSampler` animation, not executed code.

---

## 6. Companion code

**No code delta for this part.** This is a pure literacy/concept part.

- No new modules introduced in `companions/dealfinder/`.
- No step tag in `tutorial-dealfinder` repo; this part sits between `step-01`
  (data layer + snapshot) and `step-02` (deal scoring). Mark in the MDX that
  the companion repo does not advance here — readers should stay on `step-01`
  while reading this part.
- Forward note: Part 6 (`dealfinder-structured-extraction`) is the first part
  where LLM API calls appear in real code; this part is the prerequisite that
  makes those calls legible.

---

## 7. Animations

1. **REUSE `Tokenizer`** — re-theme the input string from a generic sentence to
   `"Sony WH-1000XM5 Wireless Noise Cancelling Headphones"`. Show token splits
   with count badge. Concept made visible: a model-number identifier balloons to
   many tokens; understanding this predicts extraction cost and failure modes.

2. **REUSE `AttentionView`** — re-theme the token sequence to the Bose QC45
   price example above (`["Bose", "QuietComfort", "45", "@", "$46"]`). Heat-map
   rows show which tokens each output token attends to most. Concept made visible:
   attention is why the model can link `$46` to `Bose` across a noisy title —
   and why it can be fooled when the retailer name appears before the brand.

Both existing components; no new component needed for this part. Two distinct
concepts (tokenization cost vs. attention routing), two distinct visual shapes
(linear token strip vs. attention grid).

---

## 8. Teaching beats

1. **Hook** — "The LLM call in Part 6 extracts brand from `'Walmart - COWIN E7
   ANC'`. Before we write it, let's understand exactly what happens inside."
2. **Tokenization** — what a token is; demo with the Sony title; token count
   math for 270-item batch (illustrative: ~10,800 tokens); why model-number
   strings are expensive and fragile.
3. **Attention** — key/query/value intuition without matrices; demo with the
   Bose QC45 sequence; why context position matters for long titles.
4. **Generation & temperature** — argmax vs. sampling; temp = 0 contract for
   the extraction pipeline; when you'd allow temp > 0 in a summarization agent.
5. **Non-determinism** — what is and is not deterministic (same model, same
   temp = 0 prompt → same output; different model versions → not guaranteed);
   implications for the eval harness in Part 19.
6. **Bridge forward** — "Part 3 uses a classical gradient-boosted model (no LLM)
   to score deals. Part 6 is where LLM calls enter the code. Now you know what
   those calls are doing."

---

## 9. Cross-references

**Back:** Part 1 (Data layer, normalization & the snapshot) built the pipeline
that pulls real titles like `"Sony WH-1000XM5"` and exposed the `brand`-as-retailer
messiness; Part 2 explains the cognitive model that will later read those titles.

**Forward:** Part 3 (Is it a good deal? — median vs. model) introduces the
deal-scoring signal using classical ML on the snapshot — no LLMs yet. The first
real LLM API call appears in Part 6 (Structured extraction), where the literacy
built here pays off directly.

---

## 10. Reproducibility checks

This is a CONCEPT part; no snapshot metrics are quoted. The only number given
is the illustrative token estimate (270 items × ~40 tokens ≈ 10,800), which is
explicitly labeled as a rough estimate, not a measured value. No test needed.

If the `Tokenizer` animation is wired to a tokenizer library (e.g., `tiktoken`),
assert in a unit test:

```
assert len(tokenize("Sony WH-1000XM5 Wireless Noise Cancelling Headphones")) >= 8
```

This is an animation concern, not a tutorial metric, and is optional.

---

## 11. Risks / notes

- **No GPU, no API key required.** This part is entirely browser-side concept.
  No environment setup beyond what Part 1 established.
- **Non-determinism caveat:** the temperature demo claims temp = 0 is
  deterministic. This is true for a fixed model version and provider; note in
  the MDX that different model releases or providers may differ. The course
  locks `gpt-4o-mini` for extraction steps to reduce drift.
- **Avoid oversimplification:** do not claim the attention demo shows "the real
  attention weights" — the `AttentionView` animation is illustrative. Add a
  one-line note that production weights are high-dimensional and not directly
  inspectable this way.
- **Keep it short.** This is a literacy interlude between two code-heavy parts.
  Target read time: 10–12 minutes. No exercises, no companion code — learners
  who already know transformers can skim.
