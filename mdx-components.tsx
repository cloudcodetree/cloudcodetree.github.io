import type { MDXComponents } from 'mdx/types';
import Callout from './app/components/mdx/Callout';
import TutorialHero from './app/components/mdx/TutorialHero';
import SchemaMap from './app/components/mdx/SchemaMap';
import DedupMerge from './app/components/mdx/DedupMerge';
import RunHistory from './app/components/mdx/RunHistory';
import ScaleSwap from './app/components/mdx/ScaleSwap';
import Tokenizer from './app/components/mdx/Tokenizer';
import EmbeddingSpace from './app/components/mdx/EmbeddingSpace';
import AttentionView from './app/components/mdx/AttentionView';
import TemperatureSampler from './app/components/mdx/TemperatureSampler';
import RegressionFit from './app/components/mdx/RegressionFit';
import DealResidual from './app/components/mdx/DealResidual';
import RecStrategies from './app/components/mdx/RecStrategies';
import RankingMetric from './app/components/mdx/RankingMetric';
import HybridFusion from './app/components/mdx/HybridFusion';
import ValueRerank from './app/components/mdx/ValueRerank';

// Required by @next/mdx (App Router). MDX element styling is applied by the
// tutorial article layout (markdownSx-style wrapper); here we expose custom
// components so .mdx files can use <Callout>, <TutorialHero> etc. without importing.
// Concept animations are bespoke per concept (not one reused shape): SchemaMap
// (adapter/normalization), DedupMerge (dedup), RunHistory (deterministic tests).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Callout, TutorialHero,
    SchemaMap, DedupMerge, RunHistory, ScaleSwap,
    Tokenizer, EmbeddingSpace, AttentionView, TemperatureSampler,
    RegressionFit, DealResidual,
    RecStrategies, RankingMetric,
    HybridFusion, ValueRerank,
  };
}
