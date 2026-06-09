The keynote got the Siri headlines, but the developer story worth your attention is **Xcode 27's agentic overhaul**. You can now run Anthropic, Google, and OpenAI agents directly inside Xcode, with interactive planning, multi-turn Q&A, and a canvas that renders Markdown, diffs, and previews side by side.

The part that actually changes how long an agent can run unattended: Xcode now gives agents the tools to *validate their own work* — writing and running tests, trying ideas in isolated Playgrounds, checking visual changes through previews, and driving the simulator via a new Device Hub. Plug-ins let you add custom skills, wire in tools over **MCP**, and connect any agent that speaks the **Agent Client Protocol (ACP)**; GitHub and Figma ship one-click integrations.

For engineers, this is Apple adopting the same open agent plumbing (MCP, ACP) the rest of the ecosystem standardized on, rather than a walled garden — which means your existing skills and MCP servers travel into Xcode.

**Sources:** [Apple Newsroom](https://www.apple.com/newsroom/2026/06/apple-aids-app-development-with-new-intelligence-frameworks-and-advanced-tools/), [Technetbook breakdown](https://www.technetbooks.com/2026/06/xcode-27-unveiled-at-wwdc-2026-ai-agent.html)
