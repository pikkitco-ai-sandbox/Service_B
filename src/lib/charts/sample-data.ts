/**
 * Sample data seeded from real Pikkit pipeline structures.
 * Replace with live API calls in Phase D.
 */

import type {
  SankeyData,
  TimelineData,
  ChordData,
  CircleNode,
} from "./types";
import { palette } from "./theme";

/* ── Pipeline Flow (Sankey) ── */

export const pipelineSankeyData: SankeyData = {
  nodes: [
    { id: "incoming", label: "Incoming Tickets", color: palette.blue },
    { id: "mislink", label: "Mislink Agent", color: palette.purple },
    { id: "dummy", label: "Dummy Agent", color: palette.teal },
    // Cascade levels
    { id: "event", label: "Event (L1)", color: "#c47a7a" },
    { id: "entity", label: "Entity (L2)", color: palette.amber },
    { id: "market", label: "Market (L3)", color: palette.green },
    { id: "outcome", label: "Outcome (L4)", color: palette.blue },
    // Categories
    { id: "event_identity", label: "Event Identity" },
    { id: "player_identity", label: "Player Identity" },
    { id: "player_collision", label: "Player Collision" },
    { id: "market_type", label: "Market Type" },
    { id: "market_scope", label: "Market Scope" },
    { id: "outcome_direction", label: "Outcome Dir." },
    { id: "not_mislink", label: "Not Mislink" },
    // Decisions
    { id: "approved", label: "Approved", color: palette.green },
    { id: "rejected", label: "Rejected", color: palette.rose },
    { id: "modified", label: "Modified", color: palette.amber },
    { id: "pending", label: "Pending", color: palette.slate },
  ],
  links: [
    { source: "incoming", target: "mislink", value: 60 },
    { source: "incoming", target: "dummy", value: 35 },
    { source: "mislink", target: "event", value: 18 },
    { source: "mislink", target: "entity", value: 22 },
    { source: "mislink", target: "market", value: 14 },
    { source: "mislink", target: "outcome", value: 6 },
    { source: "event", target: "event_identity", value: 14 },
    { source: "event", target: "not_mislink", value: 4 },
    { source: "entity", target: "player_identity", value: 11 },
    { source: "entity", target: "player_collision", value: 11 },
    { source: "market", target: "market_type", value: 9 },
    { source: "market", target: "market_scope", value: 5 },
    { source: "outcome", target: "outcome_direction", value: 6 },
    { source: "event_identity", target: "approved", value: 10 },
    { source: "event_identity", target: "rejected", value: 2 },
    { source: "event_identity", target: "modified", value: 2 },
    { source: "player_identity", target: "approved", value: 8 },
    { source: "player_identity", target: "pending", value: 3 },
    { source: "player_collision", target: "approved", value: 9 },
    { source: "player_collision", target: "rejected", value: 2 },
    { source: "market_type", target: "approved", value: 7 },
    { source: "market_type", target: "modified", value: 2 },
    { source: "market_scope", target: "approved", value: 4 },
    { source: "market_scope", target: "pending", value: 1 },
    { source: "outcome_direction", target: "approved", value: 5 },
    { source: "outcome_direction", target: "rejected", value: 1 },
  ],
};

/* ── Session Replay (Timeline) ── */

export const sessionTimelineData: TimelineData = {
  totalDuration: 45_000,
  rows: [
    {
      label: "ENG-10806",
      segments: [
        { stage: "tag", start: 0, end: 3200, tooltip: "CascadeClassifier: event_identity_mismatch (0.96)" },
        { stage: "analyze", start: 3200, end: 9800, tooltip: "AnalyzerAgent: root cause identified" },
        { stage: "solve", start: 9800, end: 16500, tooltip: "SolverAgent: add_market_mapping proposed" },
        { stage: "notify_slack", start: 16500, end: 17200, tooltip: "Slack notification sent" },
        { stage: "execute", start: 32000, end: 35000, tooltip: "Human approved → executing fix" },
      ],
    },
    {
      label: "ENG-10409",
      segments: [
        { stage: "tag", start: 500, end: 2800, tooltip: "CascadeClassifier: player_name_collision (0.92)" },
        { stage: "analyze", start: 2800, end: 8200, tooltip: "AnalyzerAgent: entity mismatch" },
        { stage: "solve", start: 8200, end: 14000, tooltip: "SolverAgent: update_entity_mapping" },
        { stage: "notify_slack", start: 14000, end: 14500, tooltip: "Slack notification sent" },
        { stage: "handle_feedback", start: 28000, end: 30000, tooltip: "Human rejected → feedback logged", color: palette.rose },
      ],
    },
    {
      label: "ENG-11023",
      segments: [
        { stage: "tag", start: 1200, end: 4500, tooltip: "CascadeClassifier: market_type_mismatch (0.88)" },
        { stage: "analyze", start: 4500, end: 11000, tooltip: "AnalyzerAgent: market mapping gap" },
        { stage: "solve", start: 11000, end: 18000, tooltip: "SolverAgent: add_market_mapping" },
        { stage: "notify_slack", start: 18000, end: 18600, tooltip: "Slack notification sent" },
      ],
    },
    {
      label: "SUP-4412",
      segments: [
        { stage: "classify", start: 200, end: 2000, tooltip: "Dummy: support_bug (0.94)", color: palette.teal },
        { stage: "analyze", start: 2000, end: 6000, tooltip: "Context analysis" },
        { stage: "propose", start: 6000, end: 9500, tooltip: "Resolution: create_pr", color: palette.green },
        { stage: "review", start: 9500, end: 10200, tooltip: "Sent for review" },
      ],
    },
  ],
};

/* ── System Architecture (Chord) ── */

export const systemChordData: ChordData = {
  modules: [
    { name: "Gateway", color: palette.blue },
    { name: "Tagger", color: palette.purple },
    { name: "Analyzer", color: palette.green },
    { name: "Solver", color: palette.amber },
    { name: "Slack", color: palette.teal },
    { name: "MongoDB", color: palette.rose },
    { name: "ChromaDB", color: "#c7c47a" },
    { name: "Memory", color: "#7ac4c4" },
    { name: "Linear", color: "#c47ab4" },
  ],
  matrix: [
    //  Gw  Tag Ana Sol Slk Mdb Chr Mem Lin
    [0,  30,  0,  0, 15,  0,  0,  5, 10], // Gateway
    [30,  0, 25,  0,  0, 20,  0,  5,  0], // Tagger
    [0,  25,  0, 20,  0, 10,  8, 10,  5], // Analyzer
    [0,   0, 20,  0, 15,  5,  0,  8,  0], // Solver
    [15,  0,  0, 15,  0,  0,  0,  0,  5], // Slack
    [0,  20, 10,  5,  0,  0,  0,  0,  0], // MongoDB
    [0,   0,  8,  0,  0,  0,  0, 12,  0], // ChromaDB
    [5,   5, 10,  8,  0,  0, 12,  0,  0], // Memory
    [10,  0,  5,  0,  5,  0,  0,  0,  0], // Linear
  ],
};

/* ── Codebase Explorer (Packed Circles) ── */

export const codebaseCircleData: CircleNode = {
  name: "pikkit",
  children: [
    {
      name: "Mislink Agent",
      children: [
        { name: "orchestrator", value: 420 },
        { name: "tagger", value: 380 },
        { name: "analyzer", value: 350 },
        { name: "solver", value: 310 },
        { name: "schemas", value: 280 },
        { name: "integrations", value: 450 },
        { name: "knowledge", value: 260 },
        { name: "memory", value: 200 },
        { name: "api", value: 340 },
        { name: "tests", value: 520 },
      ],
    },
    {
      name: "Dummy Agent",
      children: [
        { name: "orchestrator", value: 300 },
        { name: "tagger", value: 240 },
        { name: "analyzer", value: 220 },
        { name: "schemas", value: 180 },
        { name: "api", value: 260 },
        { name: "memory", value: 160 },
        { name: "tests", value: 380 },
      ],
    },
    {
      name: "Service B",
      children: [
        { name: "slack", value: 280 },
        { name: "backend", value: 200 },
        { name: "state", value: 140 },
        { name: "contracts", value: 120 },
        { name: "charts", value: 600 },
        { name: "tests", value: 180 },
      ],
    },
    {
      name: "Documentation",
      children: [
        { name: "services", value: 180 },
        { name: "functions", value: 320 },
        { name: "adr", value: 240 },
        { name: "glossary", value: 80 },
      ],
    },
  ],
};

