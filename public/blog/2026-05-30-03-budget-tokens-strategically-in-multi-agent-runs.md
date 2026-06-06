With dynamic workflows consuming substantially more tokens, a practical rule of thumb from developers: use a smaller/cheaper model for indexing and low-risk classification phases, reserve the strongest model only for final verification steps. Check `/model` before launching expensive workflows, and scope to a single service or directory before expanding to the full codebase.

---
*Sources: [Claude Code Docs](https://code.claude.com/docs/en/workflows) · [agentpedia.codes guide](https://agentpedia.codes/blog/claude-opus-4-8-claude-code-workflows)*
