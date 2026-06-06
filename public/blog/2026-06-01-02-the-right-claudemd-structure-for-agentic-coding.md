Your CLAUDE.md file is the single most impactful thing you can configure for Claude Code sessions — it onboards every new session and shapes every agent decision. Best practices: cover build/lint/test commands by stack, spell out import patterns and naming rules, and explicitly list what Claude should *not* do. Critically, skip project directory trees — they go stale immediately and the agent can explore the filesystem directly. Keep it under ~500 lines or Claude starts treating it as noise.

---
*Sources: [Claude Code Best Practices Docs](https://code.claude.com/docs/en/best-practices) · [Implementation Guide (groff.dev)](https://www.groff.dev/blog/implementing-claude-md-agent-skills)*
