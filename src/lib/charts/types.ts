/** Typed interfaces for all chart data structures. */

/* ── Chord Diagram ── */

export interface ChordModule {
  name: string;
  color?: string;
}

export interface ChordData {
  modules: ChordModule[];
  /** Row-major interaction matrix (modules.length x modules.length). */
  matrix: number[][];
}

/* ── Sankey Flow ── */

export interface SankeyNode {
  id: string;
  label: string;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/* ── Session Timeline ── */

export interface TimelineSegment {
  stage: string;
  start: number; // ms offset from session start
  end: number;
  color?: string;
  tooltip?: string;
}

export interface TimelineRow {
  label: string;
  segments: TimelineSegment[];
}

export interface TimelineData {
  rows: TimelineRow[];
  totalDuration: number; // ms
}

/* ── Packed Circle Explorer ── */

export interface CircleNode {
  name: string;
  value?: number;
  children?: CircleNode[];
  color?: string;
}

/* ── Memory Flow Map ── */

export interface MemoryFlowNode {
  id: string;
  label: string;
  type: "source" | "process" | "store" | "output";
  color?: string;
}

export interface MemoryFlowEdge {
  source: string;
  target: string;
  label?: string;
  value?: number;
}

export interface MemoryFlowData {
  nodes: MemoryFlowNode[];
  edges: MemoryFlowEdge[];
}

/* ── Pipeline Run (from Python API) ── */

export interface PipelineRun {
  ticket_id: string;
  run_id: string;
  current_step: string;
  classification?: {
    category: string;
    confidence: number;
    stage?: string;
    severity?: string;
    reasoning?: string;
  };
  resolution?: {
    action: string;
    confidence: number;
    description?: string;
  };
  human_decision?: string;
  duration_ms?: number;
  timestamp?: string;
}

/* ── Memory Summary (from JSONL store) ── */

export interface MemorySummary {
  ticket_id: string;
  run_id: string;
  timestamp: string;
  category: string;
  confidence: number;
  resolution: string;
  human_decision: string;
  duration_ms: number;
  key_insight?: string;
  stage?: string;
  severity?: string;
}

/* ── Eval Metrics (from artifacts/eval/) ── */

export interface EvalMetrics {
  overall_accuracy: number;
  stage_accuracy: Record<string, number>;
  category_distribution: Record<string, number>;
  confusion_matrix?: Record<string, Record<string, number>>;
}
