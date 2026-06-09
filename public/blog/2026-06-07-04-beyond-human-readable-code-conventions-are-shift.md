This new paper makes a concrete engineering argument: once LLM agents are the main consumers reading, writing, and debugging your code, optimizing purely for human readability can be counterproductive. It proposes *semantic density optimization* (strip zero-information tokens, keep high-signal ones), a *program skeleton* abstraction for fast agent navigation, and — provocatively — the selective "rehabilitation" of classical anti-patterns, validated on a log-format token-economy experiment. Useful framing when you design how agents log, summarize, and traverse a codebase.

---
*Sources: [arXiv 2604.07502](https://arxiv.org/abs/2604.07502)*
