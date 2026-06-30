import type { MDXComponents } from 'mdx/types';
import Callout from './app/components/mdx/Callout';
import TutorialHero from './app/components/mdx/TutorialHero';
import ConceptFlow from './app/components/mdx/ConceptFlow';
import DeterministicRun from './app/components/mdx/DeterministicRun';

// Required by @next/mdx (App Router). MDX element styling is applied by the
// tutorial article layout (markdownSx-style wrapper); here we expose custom
// components so .mdx files can use <Callout>, <TutorialHero> etc. without importing.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, Callout, TutorialHero, ConceptFlow, DeterministicRun };
}
