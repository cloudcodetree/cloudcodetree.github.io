# DealFinder blog deep-scan findings (2026-08-03)

Deep read of all 279 AI-news posts (Jul 1 – Aug 3 2026) against the 37-part course.
60 raw findings, ~219 rejected. **Each must be verified against actual lesson text before applying**
(the RRF cluster was a false positive — P5 already teaches it; the brief undersold the lesson).

Status key: APPLIED · QUEUE (fold in when walkthrough reaches part) · VERIFY (check not already covered) · REJECT-DUP

---

## Part 10 — fine-tune (the biggest enrichment magnet; just walked)
- **GOTCHA Flash Attention 2 not on T4** [07-22]: `attn_implementation="flash_attention_2"` is Ampere+ only; the free Colab T4 (which the notebook targets) is Turing → fails. Also needs bf16/fp16. HIGH — corrects a trap. QUEUE→P10.
- **Catastrophic-forgetting gate** [07-26, 07-02]: `lm_eval --model hf --tasks mmlu,gsm8k --num_fewshot 5` base-vs-tuned; red flags MMLU drop >3pts / GSM8K >4pts; `--num_fewshot 5` load-bearing. HIGH, corroborated ×2. QUEUE→P10 (pairs w/ P23 gate).
- **Chat-template preflight** [07-10]: wrong format (Alpaca/ShareGPT/ChatML) → train on structured noise; `standardize_sharegpt()` + `get_chat_template(...,"chatml")` + print 2-3 samples verify `<|im_start|>`/EOS before training. HIGH. QUEUE→P10.
- **GGUF export + Ollama** [07-30]: `save_pretrained_gguf(...,"q4_k_m")` + `ollama create`; #1 failure = chat-template mismatch → garbage. Closes "trained→served locally" gap. QUEUE→P10.
- **LoRA hyperparameter numbers** [07-04]: alpha=2×r heuristic; target all attn+MLP not just q/v; rank table (16-32 instruction); single-epoch rule. Validates course r=16. QUEUE→P10 sidebar.
- **GGUF/GPTQ/AWQ decision table** [07-08]: GGUF local (Q4_K_M ~4GB/7B), AWQ new prod default, GPTQ legacy; vLLM `--quantization awq`. QUEUE→P10/P27.
- **Reasoning-collapse 75/25 mix** [07-31]: SFT without CoT unlearns `<think>`; 75/25 reasoning/domain, unstable <50%. QUEUE→P10/P19 (course uses non-reasoning base → low priority).
- **GRPO sidebar** [07-08]: verifiable-reward RL, python reward fns, no critic → 40-60% less mem, T4-runnable. QUEUE→P10 (SFT/DPO/GRPO decision table).
- **DeepSpeed ZeRO multi-GPU** [07-23]: stage 1/2/3 table, `accelerate launch`, cpu offload. QUEUE→P10 "outgrow one GPU" (low priority — course is single-GPU).

## Part 25 — safety (second magnet; incident callout already added)
- **More real CVEs** [07-28 Kiro CVE-2026-10591 CVSS 8.8 overwrites mcp.json→RCE; 07-18 LiteLLM CVE-2026-42271 CVSS 10.0; 07-19 six Claude Code permission-bypass exhibits]. Extend existing incident callout + supply-chain layer. QUEUE→P25.
- **promptfoo red-team** [07-14]: `promptfoo redteam init/run`, 50+ attack classes, CI `--max-concurrency 10` + `severity: critical` gate. Automated red-team to complement manual stack. QUEUE→P25 (also P36).
- **Defense-in-depth payloads** [07-15]: HTML-comment/white-on-white-PDF/tool-response goal-hijack injection samples; "gate destructive actions via a validator that does NOT re-read retrieved content". QUEUE→P25 (testable vs P11 loop).
- **Anthropic Zero Trust for agents** [07-29]: per-session task-scoped creds, action gates, agentic SOAR; named citable framework. QUEUE→P25.
- **MCP 5 attacks / SSRF blocklist** [07-13]: validate `aud`, block 169.254/10/172.16/192.168/127, key sessions by user:session. QUEUE→P25/P12.

## Part 27 — inference optimization (levers already extended)
- **Knowledge distillation** [07-20]: TRL `DistillationTrainer` GKD, lmbda/beta knobs, R1-Distill-32B kept ~85% at 1/20 cost. Missing 3rd cost lever. QUEUE→P27.
- **SGLang RadixAttention** [07-21]: cross-request radix-tree KV cache, 6.4× on 60%+ shared prefix, `prefix_cache_hit_rate` log. 2nd impl reinforcing KV-cache clause. QUEUE→P27/P26.
- **vLLM multi-LoRA serving** [07-14]: `--enable-lora --lora-modules ... --max-loras 4`, hot-load, 20 adapters ~1GB. "Your P10 adapter in prod". QUEUE→P27.
- **Batch API 50%** [07-14]: 100K req/job, `custom_id` reconcile, ×prompt-cache = ~5% cost. QUEUE→P23/P27.
- **HF `--model-impl transformers`** [07-13]: serve any HF model at native vLLM speed, one flag. QUEUE→P10/P27.

## Part 12 — MCP (stdio-security note already added)
- **FastMCP OAuth 2.1** [07-20]: `auth=JWTVerifier(jwks_uri/issuer/audience)` / `OAuthProxy` / `RemoteOAuth`; answers "must expose over HTTP". Cross-links P32. QUEUE→P12.
- **MCP 5-attacks** — see P25.
- **Spec detail** [07-25]: initialize handshake dropped, sampling/roots deprecated 12mo, tools-list cacheable; none touch stdio server. QUEUE→P12 (already have stateless note — light).

## Part 16 — context engineering
- **Server-side compaction API** [07-06]: header `compact-2026-01-12`, `context_management.edits compact_20260112 trigger_token_count`; compact at 40-50% not 80%. Build-it-then-show-native. QUEUE→P16.
- **Tool-result clearing** [07-06]: `clear_tool_result` edit; layered loop retrieve→compact@40%→clear-old. 3rd strategy. QUEUE→P16.
- **count_tokens preflight** [07-11]: `client.messages.count_tokens()` zero-cost <1%, pass `tools=`; router <8k→Haiku etc. Provider-side counterpart to tiktoken. QUEUE→P16/P30.
- **80% prompt-cut case study** [07-29]: Anthropic cut Claude Code prompt 80% for Opus 5, no regression; less-is-more counterweight. QUEUE→P16.

## Part 24 — MLOps loop (model-drift-as-ops-event theme; corroborated ×3)
- **Gemma 4 in-place reweight** [07-20]: HF weights changed with NO version bump → pin `revision` hash. QUEUE→P24.
- **DeepSeek retirement** [07-24]: aliases killed, replacement defaults thinking-on → `extra_body thinking_enabled:False`. QUEUE→P24/P6.
- **Sonnet 5 migration** [07-08]: +30% tokens, sampling knobs 400, thinking counts vs max_tokens. QUEUE→P24/P16/P30.

## Part 14 — RAG
- **Contextual Retrieval** [07-09]: prepend 50-100tok LLM chunk-context before embed+BM25; measured 49% fail reduction (67% w/ reranker); `cache_control ephemeral` -90% cost. HIGH, measured, named. QUEUE→P14/P5.
- **Chunking defaults** [07-25]: 256-512 factoid / 1024-2048 analytical, 10-20% overlap, structure-aware; wrong chunking -20-30% recall. QUEUE→P14.
- **Cross-encoder table** [07-31]: ms-marco-MiniLM-L-6 ~30ms, bge-reranker-v2-m3 best-local ~80ms; skip <500 docs. Adds numbers to queued item. QUEUE→P14.
- **GraphRAG** [08-02]: synthesis queries fail cosine; entity→Leiden→community-summaries; ~$0.34/30K words; LazyGraphRAG 90% at vector cost. QUEUE→P14/P15 (big topic — sidebar only).

## Part 23 — eval
- **LLM-as-judge recipe** [07-24, 07-11]: one criterion/call, temp=0, calibrate 30-50 hand labels need 75-90% agreement, pass@k vs pass^k, eval saturation, A/B-swap bias guard. Turns queued mention into recipe. QUEUE→P23.

## Part 30 — observability
- **OpenLLMetry/OTel** [08-03]: `traceloop-sdk`, standard gen_ai.* span attrs, backend via env var. Standards version of hand-rolled tracing. QUEUE→P30.
- **Sonnet-5 tokenizer cost** [08-02]: +30% tokens at flat per-token → attribute per-request not per-rate. QUEUE→P30.
- **Copilot billing shock** [07-05]: agentic ~1000× tokens, $50-500/session, 10-50× overruns. Motivating case. QUEUE→P30.
- **LiteLLM gateway budgets** [07-18]: virtual keys `max_budget`+`team_id`, fallbacks. Off-the-shelf mirror of hand-built layer. QUEUE→P30.

## Part 13 — pgvector
- **Qdrant post-filter recall gotcha** [07-12]: `WHERE brand='Sony'`+HNSW post-filters → misses rows ranked 101-1000; pgvector 0.8+ iterative scan is the fix. HIGH gotcha (course teaches pgvector HNSW). QUEUE→P13.
- **FAISS index types** [07-04]: IVFFlat nlist≈√N/nprobe 10-20%, IVFPQ 96× compress, selection table. QUEUE→P13 ("HNSW isn't the only ANN").

## Part 11 — agent (NEXT)
- **Parallel tool calls** [07-22, 08-03]: multiple `tool_use` in one turn → `asyncio.gather`, ALL results in ONE user msg (separate msgs desync); 2-4×. Corroborated ×2. QUEUE→P11.
- **xlam function-calling fine-tune** [07-19]: 55-65%→>90% tool exact-match; bridges why small models mangle tool JSON. QUEUE→P11/P10.

## Part 17 — multi-agent
- **Critic-then-merge** [07-16]: critic sees only diff, "find problems not validate", 2-of-3 role-split majority. QUEUE→P17.
- **Alberta 466M-line scan** [07-25, 07-14]: 50 parallel agents, rules-first-then-LLM, red/blue split. Real-world anchor for waterfall (P6) + orchestration (P17). QUEUE→P17/P6.

## Part 6 — extraction
- **OpenRouter model fallback** [07-11]: `extra_body={"models":[...]}` on rate-limit/context/moderation/downtime, bills only runner. One-line hardening of llm_extract. QUEUE→P6.

## Part 19 — dataset engineering
- **DPO synthetic labeling** [07-14]: 2 models answer + 70B judge (UltraFeedback rubric) → chosen; 3rd labeling strategy. QUEUE→P19.

## Part 35 — security/compliance
- **EU AI Act Article 50** [08-02]: enforceable Aug 2 2026 — AI-disclosure + machine-readable watermark for EU users; Annex III deferred Dec 2027. Dated compliance milestone. QUEUE→P35.

## Part 8 — scraping
- **Cloudflare AI Crawl Control** [07-03]: Search/Agent/Training lanes, Sep 15 default-block on ad pages; DealFinder scraper is Agent-class. Dated robots/permission update. QUEUE→P8.

## Part 4/13 — embeddings
- **Fine-tune the embedder** [07-21]: `MultipleNegativesRankingLoss` on (anchor,positive), bigger batch=more negatives, +15-40% NDCG@10; course tunes LLM never embedder. QUEUE→P4/P13 sidebar.

## REJECTED as duplicate of existing course content
- RRF k=60 (chunks 1,4,5) — P5 already teaches it with formula + worked example. REJECT-DUP.
