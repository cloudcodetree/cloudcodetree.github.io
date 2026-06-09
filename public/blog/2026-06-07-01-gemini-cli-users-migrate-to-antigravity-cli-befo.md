Google's release notes confirm that the Gemini Code Assist IDE extensions and the standalone Gemini CLI will **stop serving requests for individual, Google AI Pro, and AI Ultra tiers on June 18, 2026**. The replacement is Antigravity and the new Go-based Antigravity CLI (Gemini 3.5 Flash by default, with Gemini 3.1 Pro / 3.0 Flash available for agent mode). If any of your scripts, CI jobs, or local workflows shell out to `gemini`, they will break that day — plan the swap now rather than discovering it in a red pipeline.

---
*Sources: [Gemini Code Assist Release Notes](https://developers.google.com/gemini-code-assist/resources/release-notes)*
