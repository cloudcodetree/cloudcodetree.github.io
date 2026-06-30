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
import ExtractFlow from './app/components/mdx/ExtractFlow';
import SchemaGate from './app/components/mdx/SchemaGate';
import LoRAAdapter from './app/components/mdx/LoRAAdapter';
import FineTuneGain from './app/components/mdx/FineTuneGain';
import AgentLoop from './app/components/mdx/AgentLoop';
import ToolBelt from './app/components/mdx/ToolBelt';
import MCPBridge from './app/components/mdx/MCPBridge';
import MCPPrimitives from './app/components/mdx/MCPPrimitives';
import InjectionShield from './app/components/mdx/InjectionShield';
import GuardrailStack from './app/components/mdx/GuardrailStack';
import EvalGauntlet from './app/components/mdx/EvalGauntlet';
import ABCompare from './app/components/mdx/ABCompare';
import SemanticCacheViz from './app/components/mdx/SemanticCacheViz';
import Batching from './app/components/mdx/Batching';
import CDPipeline from './app/components/mdx/CDPipeline';
import ContainerParity from './app/components/mdx/ContainerParity';
import CostDashboard from './app/components/mdx/CostDashboard';
import DriftMonitor from './app/components/mdx/DriftMonitor';

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
    ExtractFlow, SchemaGate,
    LoRAAdapter, FineTuneGain,
    AgentLoop, ToolBelt,
    MCPBridge, MCPPrimitives,
    InjectionShield, GuardrailStack,
    EvalGauntlet, ABCompare,
    SemanticCacheViz, Batching,
    CDPipeline, ContainerParity,
    CostDashboard, DriftMonitor,
  };
}
