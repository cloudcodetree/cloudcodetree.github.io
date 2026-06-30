import type { MDXComponents } from 'mdx/types';
import Callout from './app/components/mdx/Callout';
import TutorialHero from './app/components/mdx/TutorialHero';
import SchemaMap from './app/components/mdx/SchemaMap';
import DedupMerge from './app/components/mdx/DedupMerge';
import RunHistory from './app/components/mdx/RunHistory';

// Required by @next/mdx (App Router). MDX element styling is applied by the
// tutorial article layout (markdownSx-style wrapper); here we expose custom
// components so .mdx files can use <Callout>, <TutorialHero> etc. without importing.
// Concept animations are bespoke per concept (not one reused shape): SchemaMap
// (adapter/normalization), DedupMerge (dedup), RunHistory (deterministic tests).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, Callout, TutorialHero, SchemaMap, DedupMerge, RunHistory };
}
