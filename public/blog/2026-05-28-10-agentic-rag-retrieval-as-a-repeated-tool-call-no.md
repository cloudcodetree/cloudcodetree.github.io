Modern RAG best practice treats retrieval as something the agent can invoke multiple times during a task rather than once before generation. Combining dense vector search with sparse BM25 retrieval and re-ranking improves precision significantly. Warning: multi-step reflection loops consume 3–10x more tokens than classic RAG — only worth it for complex reasoning workloads.

---
*Source: DigitalApplied*
