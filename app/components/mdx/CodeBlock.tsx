import { codeToHtml } from 'shiki';

/**
 * VSCode-style syntax highlighting for MDX fenced code blocks.
 *
 * Registered as the `pre` override in mdx-components.tsx. MDX renders a fenced
 * block as `<pre><code class="language-xxx">…</code></pre>`; this async Server
 * Component intercepts the `<pre>`, highlights the code with Shiki (the same
 * engine + "Dark+" theme VSCode uses), and emits static HTML. Because it runs
 * at build time under `output: 'export'`, there is ZERO runtime JS and it stays
 * static-export-safe. (We do this here rather than via a rehype plugin because
 * Turbopack — `dev --turbo` — can't serialize MDX plugin options.)
 *
 * Inline code (single backticks) is untouched — it never becomes a <pre>, so it
 * keeps the site's pill styling from the article layout.
 */

function textOf(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && node !== null && 'props' in node) {
    return textOf((node as { props?: { children?: unknown } }).props?.children);
  }
  return String(node);
}

export default async function CodeBlock(props: React.ComponentPropsWithoutRef<'pre'>) {
  const codeEl = props.children as { props?: { className?: string; children?: unknown } } | undefined;
  const className = codeEl?.props?.className ?? '';
  const lang = /language-([\w-]+)/.exec(className)?.[1] ?? 'text';
  const code = textOf(codeEl?.props?.children).replace(/\n$/, '');

  let html: string;
  try {
    html = await codeToHtml(code, { lang, theme: 'dark-plus' });
  } catch {
    // Unknown/unloadable grammar → fall back to plain text (still themed).
    html = await codeToHtml(code, { lang: 'text', theme: 'dark-plus' });
  }

  // Drop Shiki's own background so the site's slate code-panel background (from
  // the article layout's `& pre` styles) shows through; keep the token colors.
  html = html.replace(/(<pre[^>]*style=")background-color:[^;"]*;?/, '$1');

  return <div className="shiki-block" dangerouslySetInnerHTML={{ __html: html }} />;
}
