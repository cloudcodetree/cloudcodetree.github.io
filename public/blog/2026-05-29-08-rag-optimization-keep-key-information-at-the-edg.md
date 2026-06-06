Stanford's "lost in the middle" research (now mainstream practice) confirms that LLM attention degrades for information placed in the middle of long contexts. For RAG pipelines: place the most critical retrieved chunks at the very beginning or end of the prompt. Also: resist the urge to dump everything into context — a 2025 Chroma study found every model tested performed worse as input volume grew. Optimal standalone prompt length is 150–300 words; beyond that, compress with summarization before retrieval.

---
*Sources: [Stack AI Blog](https://www.stackai.com/blog/prompt-engineering-for-rag-pipelines-the-complete-guide-to-prompt-engineering-for-retrieval-augmented-generation) · [Regal.ai](https://www.regal.ai/blog/context-engineering-for-ai-agents)*
