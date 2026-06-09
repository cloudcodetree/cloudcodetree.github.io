The latest Claude Code release lets `Stop` and `SubagentStop` hooks return `hookSpecificOutput.additionalContext` to feed the model guidance *without* tripping a hook-error state — useful for nudging an agent to keep working instead of bailing. Also new: a `/plugin list` command with `--enabled`/`--disabled` filters, and a `$` escape in Skills so you can include a literal `$` before a digit in command bodies. Worth a scan if you script Claude Code automation.

---
*Sources: [Claude Code changelog](https://code.claude.com/docs/en/changelog) · [Releasebot: Claude Code June 2026](https://releasebot.io/updates/anthropic/claude-code)*
