import type { MDXComponents } from 'mdx/types';
import Callout from './app/components/mdx/Callout';
import TutorialHero from './app/components/mdx/TutorialHero';
import CodeBlock from './app/components/mdx/CodeBlock';
import SchemaMap from './app/components/mdx/SchemaMap';
import DedupMerge from './app/components/mdx/DedupMerge';
import RetailerBrandSplit from './app/components/mdx/RetailerBrandSplit';
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
import TextToSQL from './app/components/mdx/TextToSQL';
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
import SystemMap from './app/components/mdx/SystemMap';
import SkillsMap from './app/components/mdx/SkillsMap';
import MultiSourceFunnel from './app/components/mdx/MultiSourceFunnel';
import OAuthFlow from './app/components/mdx/OAuthFlow';
import RateLimitGuard from './app/components/mdx/RateLimitGuard';
import ScrapingPermissionTiers from './app/components/mdx/ScrapingPermissionTiers';
import TierWaterfall from './app/components/mdx/TierWaterfall';
import StoreVsMemory from './app/components/mdx/StoreVsMemory';
import VectorIndex from './app/components/mdx/VectorIndex';
import GroundingGuard from './app/components/mdx/GroundingGuard';
import AgenticLoop from './app/components/mdx/AgenticLoop';
import ContextBudget from './app/components/mdx/ContextBudget';
import WriterReviewer from './app/components/mdx/WriterReviewer';
import BoostingResidual from './app/components/mdx/BoostingResidual';
import BM25Curves from './app/components/mdx/BM25Curves';
import CosineAngle from './app/components/mdx/CosineAngle';
import Quantization from './app/components/mdx/Quantization';
import HmacVerify from './app/components/mdx/HmacVerify';
import KVCache from './app/components/mdx/KVCache';
import ItemItemCF from './app/components/mdx/ItemItemCF';
import LostInMiddle from './app/components/mdx/LostInMiddle';
import K8sReconcile from './app/components/mdx/K8sReconcile';
import CircuitStates from './app/components/mdx/CircuitStates';
import LessonScreenshot from './app/components/mdx/LessonScreenshot';
import SSEStream from './app/components/mdx/SSEStream';
import EchoFilter from './app/components/mdx/EchoFilter';
import RankingLens from './app/components/mdx/RankingLens';
import GroupedSplit from './app/components/mdx/GroupedSplit';
import LabelImbalance from './app/components/mdx/LabelImbalance';
import BoostingLift from './app/components/mdx/BoostingLift';
import PriceDropForecast from './app/components/mdx/PriceDropForecast';
import ExperimentLedger from './app/components/mdx/ExperimentLedger';
import FeatureContractGate from './app/components/mdx/FeatureContractGate';
import CacheThresholdKnob from './app/components/mdx/CacheThresholdKnob';
import CascadeEscalation from './app/components/mdx/CascadeEscalation';
import MLOpsCycleTrace from './app/components/mdx/MLOpsCycleTrace';
import PSIGauge from './app/components/mdx/PSIGauge';
import SlidingWindowClock from './app/components/mdx/SlidingWindowClock';
import GDPRAuditTrail from './app/components/mdx/GDPRAuditTrail';
import PipelineDAG from './app/components/mdx/PipelineDAG';
import DataContractGauge from './app/components/mdx/DataContractGauge';
import SavedSearchDiff from './app/components/mdx/SavedSearchDiff';
import NotifierProtocol from './app/components/mdx/NotifierProtocol';
import SearchStateMachine from './app/components/mdx/SearchStateMachine';
import ProxyTunnel from './app/components/mdx/ProxyTunnel';
import K8sReplicaSpread from './app/components/mdx/K8sReplicaSpread';
import SecretFlow from './app/components/mdx/SecretFlow';
import JwtDecodeRing from './app/components/mdx/JwtDecodeRing';
import RbacGate from './app/components/mdx/RbacGate';
import CheckoutFlow from './app/components/mdx/CheckoutFlow';
import QuotaMeter from './app/components/mdx/QuotaMeter';
import CourseResultsBoard from './app/components/mdx/CourseResultsBoard';
import ArchitectureFlow from './app/components/mdx/ArchitectureFlow';
import ChaosBreaker from './app/components/mdx/ChaosBreaker';
import E2ETestLattice from './app/components/mdx/E2ETestLattice';

// Required by @next/mdx (App Router). MDX element styling is applied by the
// tutorial article layout (markdownSx-style wrapper); here we expose custom
// components so .mdx files can use <Callout>, <TutorialHero> etc. without importing.
// Concept animations are bespoke per concept (not one reused shape): SchemaMap
// (adapter/normalization), DedupMerge (dedup), RunHistory (deterministic tests).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // VSCode-style syntax highlighting for fenced code blocks (build-time Shiki).
    // Cast: async server components are valid MDX overrides but MDXComponents'
    // types model only sync components returning ReactNode.
    pre: CodeBlock as unknown as NonNullable<MDXComponents['pre']>,
    Callout, TutorialHero,
    SchemaMap, DedupMerge, RetailerBrandSplit, RunHistory, ScaleSwap,
    Tokenizer, EmbeddingSpace, AttentionView, TemperatureSampler,
    RegressionFit, DealResidual,
    RecStrategies, RankingMetric,
    HybridFusion, ValueRerank,
    ExtractFlow, SchemaGate,
    LoRAAdapter, FineTuneGain,
    AgentLoop, ToolBelt, TextToSQL,
    MCPBridge, MCPPrimitives,
    InjectionShield, GuardrailStack,
    EvalGauntlet, ABCompare,
    SemanticCacheViz, Batching,
    CDPipeline, ContainerParity,
    CostDashboard, DriftMonitor,
    SystemMap, SkillsMap,
    MultiSourceFunnel, OAuthFlow,
    RateLimitGuard, ScrapingPermissionTiers,
    TierWaterfall,
    StoreVsMemory, VectorIndex, GroundingGuard,
    AgenticLoop, ContextBudget, WriterReviewer, BoostingResidual, BM25Curves, CosineAngle,
    Quantization, HmacVerify, KVCache, ItemItemCF, LostInMiddle, K8sReconcile, CircuitStates,
    LessonScreenshot,
    SSEStream,
    EchoFilter, RankingLens,
    GroupedSplit, LabelImbalance,
    BoostingLift, PriceDropForecast,
    ExperimentLedger, FeatureContractGate,
    CacheThresholdKnob, CascadeEscalation,
    MLOpsCycleTrace, PSIGauge,
    SlidingWindowClock, GDPRAuditTrail,
    PipelineDAG, DataContractGauge,
    SavedSearchDiff, NotifierProtocol,
    SearchStateMachine, ProxyTunnel,
    K8sReplicaSpread, SecretFlow,
    JwtDecodeRing, RbacGate,
    CheckoutFlow, QuotaMeter,
    CourseResultsBoard, ArchitectureFlow,
    ChaosBreaker, E2ETestLattice,
  };
}
