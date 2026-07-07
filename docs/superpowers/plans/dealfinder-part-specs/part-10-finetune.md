# Part 10 — Fine-tune the extractor with QLoRA (anchored)

**Phase:** P2 Intelligence | **Data mode:** CONCEPT | **Slug:** `dealfinder-finetune`

---

## 1. Objective

The learner understands how to fine-tune a small LLM with QLoRA to improve structured extraction on the real messy titles in the snapshot, and can measure the delta in field accuracy without needing a personal GPU.

---

## 2. Prerequisites

- Part 6: Structured extraction (messy titles → schema) — the baseline extractor this part improves
- Part 9: Tiered aggregation & resilience — the live pipeline that feeds dirty titles into the extractor
- Part 1: Data layer, normalization & the snapshot — origin of the retailer-polluted `brand` field being corrected

---

## 3. By the end, the learner can…

- Explain what QLoRA does to a base model's weight matrices and why it fits on consumer/colab hardware
- Construct a fine-tuning dataset from the snapshot's real titles + their gold labels (extracted manufacturer, condition, key specs)
- Configure and run a QLoRA fine-tune loop using `peft` + `trl` (notebook-runnable; illustrated numbers)
- Evaluate the fine-tuned adapter against the base extractor using the snapshot's 270 titles as a held-out eval set and read the accuracy delta
- Merge and export the adapter for use in the Part 6 extraction pipeline

---

## 4. Data

**Mode: CONCEPT.** No snapshot rows are used as live training inputs in the published tutorial — the numbers are illustrative and consistent with the snapshot's documented properties. The reader runs their own fine-tune in a Colab/Kaggle notebook using the same schema.

Illustrative numbers grounded in the snapshot:
- 270 items, 18 queries — ~220 used for train, ~50 for eval (80/20 split shown conceptually)
- The `brand` field is retailer-polluted in 154/270 rows ("Walmart - COWIN", "Target") — these are the hard cases that motivate fine-tuning over prompt-only extraction
- The hero cast titles are used as worked examples: `Sony WH-1000XM5 Wireless Noise Canceling Headphones` → gold label `{manufacturer: "Sony", model: "WH-1000XM5", condition: "new"}`

No live API calls. No snapshot file is loaded at runtime in the tutorial — the learner follows the notebook pattern, and the companion code shows the dataset construction script.

---

## 5. Worked example

**Input pipeline (shown in tutorial):**

Raw snapshot title: `"Bose QuietComfort 45 Headphones Wireless Noise Cancelling"` with `brand = "46"` (a price leak from a misparse — a real snapshot artifact). Baseline GPT-3.5 extractor (Part 6) returns `{manufacturer: "Bose", condition: "new"}` — correct but only because the title is clean. Now try: `"Walmart - COWIN E7 Active Noise Cancelling Headphones Bluetooth"` — baseline returns `{manufacturer: "Walmart", condition: "new"}` (wrong: retailer bleed).

**Fine-tune dataset construction:** the tutorial walks labeling 30 snapshot titles by hand (shown as a JSON snippet), covering the three patterns: clean title, retailer-prefixed title, and refurb/condition marker. This 30-example set is the illustrative training corpus.

**QLoRA config (illustrative, Colab-runnable):**
- Base model: `unsloth/Llama-3.2-1B-Instruct` (1B, fits 4-bit on T4)
- LoRA rank r=16, alpha=32, target modules: q_proj, v_proj
- Training: 3 epochs, batch size 4, lr 2e-4
- Illustrated loss curve: train loss 1.8 → 0.4

**Eval on held-out 50 titles (illustrative, consistent with snapshot complexity):**

| Metric | Base extractor | Fine-tuned adapter |
|---|---|---|
| Manufacturer accuracy | 78% | 94% |
| Condition recall | 61% | 82% |
| Retailer bleed rate | 29% | 4% |

Hero cast anchor: Sony WH-1000XM5 @ $162.97 (Costco). Title: `"Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones"`. Both base and fine-tuned get manufacturer right — this is the easy case. The hard case is the Anker: `"Anker Soundcore Q20i Active Noise Cancelling Headphones"` with `brand = "mountainlifestyle.ca"` in the snapshot. Base extractor returns `{manufacturer: "mountainlifestyle.ca"}`. Fine-tuned adapter returns `{manufacturer: "Anker"}` — the tutorial shows this delta as the payoff.

---

## 6. Companion code

**Existing modules used:**
- `dealfinder/extract.py` — the Part 6 base extractor; fine-tuned adapter slots in as a drop-in
- `dealfinder/data/snapshots/electronics-2026-07.json` — title corpus for dataset construction script

**New code this part introduces:**
- `dealfinder/finetune/build_dataset.py` — reads snapshot titles, applies gold labels, emits `train.jsonl` / `eval.jsonl` in chat format
- `dealfinder/finetune/train_qlora.py` — QLoRA training script (peft + trl + unsloth optional); reads `train.jsonl`, saves adapter to `adapters/extractor-v1/`
- `dealfinder/finetune/eval_extractor.py` — runs both base and adapter extractor over `eval.jsonl`, prints accuracy table
- `dealfinder/extract.py` — modified to accept an optional `adapter_path` arg; if present, loads the merged model instead of calling the API

**Step tags:** NEW — `step-10-finetune` in `tutorial-dealfinder` repo. No prior step is modified; this is an additive branch off `step-06-extract`.

---

## 7. Animations

1. **REUSE `ExtractFlow`** — re-theme with electronics: show a dirty title (`"Walmart - COWIN E7 Noise Cancelling"`) flowing through three stages: tokenizer → base LLM → structured output. Overlay a second lane showing the LoRA adapter weights merging into the frozen base at the attention layers. The visual contrast (wrong manufacturer out of base lane vs. correct out of adapter lane) is the concept.

2. **NEW: `LoRAWeightDelta`** — Visual metaphor: a frozen grid of base-model weight tiles (grey, locked padlock icons) with a thin overlay of colored LoRA delta tiles (r=16 rank, shown as 16 slim colored bars laid across the frozen matrix). An animation shows the base weights staying still while the delta bars train (grow/shrink). Text callout: "Only 0.1% of parameters move." One distinct shape: the thin bar overlay on a frozen grid — never used elsewhere.

---

## 8. Teaching beats

1. **Concept — why prompt engineering hits a ceiling** (the retailer-bleed pattern from 154/270 rows; show the `"Walmart - COWIN"` failure from the snapshot)
2. **Concept — what QLoRA does** (LoRA rank decomposition; 4-bit quantization; only adapter weights train) → `LoRAWeightDelta` animation
3. **Code — build the fine-tune dataset** (`build_dataset.py`; show a 5-row `train.jsonl` snippet with chat format)
4. **Code — run the training loop** (walk the `train_qlora.py` config; show illustrative loss curve from 1.8 → 0.4 over 3 epochs)
5. **Proof — eval delta** (`eval_extractor.py`; the accuracy table above; hero cast Anker example as the before/after)
6. **Code — slot the adapter into the pipeline** (the `adapter_path` arg in `extract.py`; show it returning `{manufacturer: "Anker"}` for the poisoned title)
7. **Concept — when NOT to fine-tune** (data cost, maintenance burden, prompt-engineering + few-shot often sufficient; framing for when this pays off)

---

## 9. Cross-references

**Back:** Part 9 (Tiered aggregation & resilience) produced the live multi-source pipeline that feeds dirty titles into the extraction step — this part retrofits that extractor with a fine-tuned adapter that reduces its retailer-bleed error rate from 29% to 4%.

**Forward:** Part 11 (The agent — ReAct, text-to-SQL, tools, HITL) uses the improved extractor as a tool the agent can call; cleaner extracted fields mean the agent's text-to-SQL queries over the snapshot return higher-precision results.

---

## 10. Reproducibility checks

Because data mode is CONCEPT, quoted accuracy numbers are illustrative — the tutorial says so explicitly. Reproducibility is at the code level:

```python
# companions/dealfinder/finetune/test_eval_extractor.py
def test_retailer_bleed_hero_case():
    """Adapter must not bleed retailer for the Anker Soundcore title."""
    title = "Anker Soundcore Q20i Active Noise Cancelling Headphones"
    result = extract_with_adapter(title, adapter_path="adapters/extractor-v1/")
    assert result["manufacturer"].lower() == "anker"

def test_base_extractor_fails_retailer_bleed():
    """Base extractor SHOULD fail this case — documents the motivation."""
    title = "Walmart - COWIN E7 Active Noise Cancelling Headphones Bluetooth"
    result = extract_base(title)
    # This assert is expected to fail (documents the gap, not a regression gate)
    assert result["manufacturer"].lower() != "walmart", "base extractor bleeds retailer"
```

The dataset construction script is deterministic given the snapshot: `python build_dataset.py --snapshot electronics-2026-07.json --seed 42` must produce the same `train.jsonl` / `eval.jsonl` on every run (checked by SHA in CI).

---

## 11. Risks / notes

- **GPU requirement:** QLoRA on a 1B model runs on a free Colab T4 (~25 min for 3 epochs on 200 examples). The tutorial opens with a Colab badge and documents the runtime. Local CPU is not viable — the tutorial says so explicitly and offers the pre-trained adapter as a download.
- **Non-determinism:** LLM training is non-deterministic even with `seed=42` across hardware. The tutorial frames numbers as "illustrative" and the eval test uses the pre-trained adapter (committed artifact), not a freshly trained one, to keep CI green.
- **Cost:** no API calls during training (local weights). Eval script calls the base extractor API for comparison — can be mocked with `--mock-base` flag for CI.
- **Adapter size:** LoRA adapter for a 1B model at r=16 is ~6 MB — safe to commit to the companion repo under `adapters/extractor-v1/`.
- **unsloth dependency:** optional; the script works with vanilla `peft` + `trl` if unsloth isn't available. CI uses the vanilla path.
