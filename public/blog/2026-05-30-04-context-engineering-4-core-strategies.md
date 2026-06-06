LangChain formalized context engineering with four strategies now widely adopted in production agent systems: **write** (persist context externally), **select** (retrieve what's relevant via RAG), **compress** (summarize and compact), and **isolate** (separate contexts for different agents). Keeping base system prompts lean at 200–800 tokens while injecting context dynamically is the production sweet spot.

---
*Sources: [Multi-Agent Orchestration Guide](https://jobsbyculture.com/blog/ai-agent-orchestration-patterns-2026) · [Context Engineering Paper](https://arxiv.org/pdf/2603.09619)*
