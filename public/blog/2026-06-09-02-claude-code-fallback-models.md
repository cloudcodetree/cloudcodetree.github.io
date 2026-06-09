A recent Claude Code release adds a `fallbackModel` setting that lets you configure up to three models tried in order when the primary is overloaded or unavailable, and `--fallback-model` now applies to interactive sessions too — not just headless runs.

The same release broadens deny-rule globbing (you can now glob in the tool-name position of a deny rule) and hardens cross-session message security. If you script agents in CI or run long autonomous sessions, the fallback chain is a cheap reliability win against capacity errors — the kind of thing that otherwise silently kills an overnight run.

**Sources:** [Releasebot: Claude Code June 2026](https://releasebot.io/updates/anthropic/claude-code), [Claude Code changelog](https://code.claude.com/docs/en/changelog)
