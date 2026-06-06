Anthropic launched dynamic workflows on May 28, enabling Claude to orchestrate up to 1,000 parallel subagents for large, complex tasks like codebase audits, migration jobs, and security reviews. The new `ultracode` mode (activate with `/effort ultracode`) lets Claude auto-decide when to spin up workflow machinery — useful for big jobs where you want full-throttle parallelism. Key tip: always start with a scoped task first to gauge token consumption before running across a whole monorepo, and drop back to `/effort high` for routine work.

---
*Sources: [Anthropic Blog](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code) · [TechCrunch](https://techcrunch.com/2026/05/28/anthropic-releases-opus-4-8-with-new-dynamic-workflow-tool/)*
