import type { MDXComponents } from 'mdx/types';
import Callout from './app/components/mdx/Callout';

// Required by @next/mdx (App Router). MDX element styling is applied by the
// tutorial article layout (markdownSx-style wrapper); here we expose custom
// components so .mdx files can use <Callout> etc. without importing them.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, Callout };
}
