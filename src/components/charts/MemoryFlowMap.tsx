"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { palette, chartDefaults } from "@/lib/charts/theme";
import { useResponsiveSize } from "@/lib/charts/useResponsiveSize";
import { useIntersectionObserver } from "@/lib/charts/useIntersectionObserver";

interface Props {
  height?: number;
  className?: string;
}

/* ── Explicit node positions as fraction of [w, h] ── */
/* Laid out as a clear left-to-right pipeline with two rows:
 *
 *   Row 1 (main flow):  Input → Gateway → Cascade → Decision → Outcome
 *   Row 2 (support):    MongoDB   LLM Fallback   Memory Stores   Feedback
 *
 *   Plus a feedback loop arc from Memory back to RAG/Cascade
 */

interface FlowNode {
  id: string;
  label: string;
  color: string;
  /** Position as fraction of drawing area [0-1, 0-1] */
  fx: number;
  fy: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  value?: number;
  style?: "solid" | "dashed";
  color?: string;
}

const nodes: FlowNode[] = [
  // ── Stage 1: Inputs (left)
  { id: "ticket",   label: "Linear Ticket",      color: palette.blue,   fx: 0.02, fy: 0.22 },
  { id: "slack",    label: "Slack Command",       color: palette.blue,   fx: 0.02, fy: 0.50 },
  { id: "mongodb",  label: "MongoDB",             color: palette.blue,   fx: 0.02, fy: 0.78 },

  // ── Stage 2: Gateway (collects input)
  { id: "gateway",  label: "Gateway Context",     color: palette.purple, fx: 0.20, fy: 0.36 },

  // ── Stage 3: Classification (center)
  { id: "cascade",  label: "CascadeClassifier",   color: palette.purple, fx: 0.40, fy: 0.28 },
  { id: "llm",      label: "LLM Fallback",        color: palette.slate,  fx: 0.40, fy: 0.58 },
  { id: "rag",      label: "RAG Bridge",          color: palette.teal,   fx: 0.40, fy: 0.78 },

  // ── Stage 4: Memory stores (right-center)
  { id: "jsonl",    label: "JSONL Memory",         color: palette.green,  fx: 0.62, fy: 0.22 },
  { id: "chroma",   label: "ChromaDB Vectors",     color: palette.green,  fx: 0.62, fy: 0.58 },
  { id: "docs",     label: "Doc Context",          color: palette.green,  fx: 0.62, fy: 0.85 },

  // ── Stage 5: Decisions & outcomes (far right)
  { id: "decision", label: "Human Decision",       color: palette.amber,  fx: 0.83, fy: 0.22 },
  { id: "execute",  label: "Auto-Execute",         color: palette.amber,  fx: 0.83, fy: 0.50 },
  { id: "feedback", label: "Feedback Log",         color: palette.rose,   fx: 0.83, fy: 0.78 },
];

const edges: FlowEdge[] = [
  // Input → Gateway
  { from: "ticket",  to: "gateway",  label: "ticket data" },
  { from: "slack",   to: "gateway",  label: "command" },
  { from: "mongodb", to: "cascade",  label: "enrichment", value: 40 },

  // Gateway → Classification
  { from: "gateway", to: "cascade",  label: "context",         value: 60 },
  { from: "cascade", to: "llm",      label: "low confidence",  value: 15, style: "dashed", color: palette.slate },

  // Classification → Memory stores
  { from: "cascade", to: "jsonl",    label: "write summary",   value: 50 },
  { from: "rag",     to: "chroma",   label: "query / index",   value: 30 },
  { from: "rag",     to: "docs",     label: "grounding",       value: 20 },

  // Classification → RAG (downward within same column)
  { from: "cascade", to: "rag",      label: "find similar",    value: 30 },

  // Classification → Decisions
  { from: "cascade", to: "decision", label: "needs human",     value: 35 },
  { from: "decision", to: "execute", label: "approved",        value: 28 },
  { from: "decision", to: "feedback", label: "rejected",       value: 7, color: palette.rose },

  // Feedback loops (dashed, colored)
  { from: "jsonl",   to: "rag",      label: "past runs",       value: 25, style: "dashed", color: palette.teal },
  { from: "feedback", to: "jsonl",   label: "learning",        value: 10, style: "dashed", color: palette.rose },
];

const NODE_W = 140;
const NODE_H = 40;

export default function MemoryFlowMap({ height = 540, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (!svgRef.current || !isVisible || !width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 20, left: 30 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Compute pixel positions
    const posMap = new Map<string, { cx: number; cy: number; x: number; y: number }>();
    nodes.forEach((n) => {
      const x = n.fx * w;
      const y = n.fy * h;
      posMap.set(n.id, { cx: x + NODE_W / 2, cy: y + NODE_H / 2, x, y });
    });

    // ── Defs: arrowheads ──
    const defs = svg.append("defs");
    const makeArrow = (id: string, fill: string) => {
      defs
        .append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,1 L9,5 L0,9 z")
        .attr("fill", fill);
    };
    makeArrow("arrow-default", chartDefaults.textMuted);
    makeArrow("arrow-teal", palette.teal);
    makeArrow("arrow-rose", palette.rose);
    makeArrow("arrow-slate", palette.slate);

    // ── Stage labels across the top ──
    const stages = [
      { label: "INPUT", x: 0.00 },
      { label: "CONTEXT", x: 0.20 },
      { label: "CLASSIFY", x: 0.40 },
      { label: "STORE", x: 0.62 },
      { label: "DECIDE", x: 0.83 },
    ];
    g.append("g")
      .selectAll("text")
      .data(stages)
      .join("text")
      .attr("x", (d) => d.x * w + NODE_W / 2)
      .attr("y", -16)
      .attr("text-anchor", "middle")
      .attr("fill", chartDefaults.textMuted)
      .attr("font-size", "10px")
      .attr("letter-spacing", "0.12em")
      .text((d) => d.label);

    // ── Edges (drawn before nodes so they sit behind) ──
    const edgeG = g.append("g");

    edges.forEach((edge, i) => {
      const src = posMap.get(edge.from);
      const tgt = posMap.get(edge.to);
      if (!src || !tgt) return;

      const isDashed = edge.style === "dashed";
      const edgeColor = edge.color ?? chartDefaults.textMuted;
      const arrowId =
        edge.color === palette.teal
          ? "arrow-teal"
          : edge.color === palette.rose
            ? "arrow-rose"
            : edge.color === palette.slate
              ? "arrow-slate"
              : "arrow-default";

      // Determine connection points
      const srcRight = src.x + NODE_W;
      const srcBottom = src.y + NODE_H;
      const tgtLeft = tgt.x;
      const tgtTop = tgt.y;

      let x1: number, y1: number, x2: number, y2: number;
      let pathD: string;

      // Is this a backward edge (going left)?
      const isBackward = src.x >= tgt.x + NODE_W * 0.5;
      // Is this a vertical edge (same column)?
      const isSameCol = Math.abs(src.x - tgt.x) < NODE_W * 0.5;

      if (isSameCol) {
        // Vertical: bottom of source → top of target
        x1 = src.cx;
        y1 = srcBottom;
        x2 = tgt.cx;
        y2 = tgtTop;
        const my = (y1 + y2) / 2;
        pathD = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
      } else if (isBackward) {
        // Backward: route as a smooth arc below
        x1 = src.cx;
        y1 = srcBottom;
        x2 = tgt.cx;
        y2 = tgt.y + NODE_H;
        const dropY = Math.max(y1, y2) + 50;
        pathD = `M${x1},${y1} C${x1},${dropY} ${x2},${dropY} ${x2},${y2}`;
      } else {
        // Forward: right side → left side
        x1 = srcRight;
        y1 = src.cy;
        x2 = tgtLeft;
        y2 = tgt.cy;
        const mx = (x1 + x2) / 2;
        pathD = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }

      const strokeW = edge.value ? Math.max(1.5, Math.min(5, edge.value / 12)) : 1.5;

      edgeG
        .append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", edgeColor)
        .attr("stroke-width", strokeW)
        .attr("stroke-dasharray", isDashed ? "5,4" : "none")
        .attr("stroke-opacity", isDashed ? 0.5 : 0.35)
        .attr("marker-end", `url(#${arrowId})`)
        .attr("opacity", 0)
        .transition()
        .delay(i * 60 + 200)
        .duration(chartDefaults.transitionMs)
        .attr("opacity", 1);

      // Edge label
      if (edge.label) {
        const lx = (x1 + x2) / 2;
        const ly = isSameCol
          ? (y1 + y2) / 2
          : isBackward
            ? Math.max(y1, y2) + 35
            : (y1 + y2) / 2 - 8;

        edgeG
          .append("text")
          .attr("x", lx)
          .attr("y", ly)
          .attr("text-anchor", "middle")
          .attr("fill", edgeColor)
          .attr("font-size", "9px")
          .attr("opacity", 0)
          .text(edge.label)
          .transition()
          .delay(i * 60 + 500)
          .duration(400)
          .attr("opacity", isDashed ? 0.7 : 0.9);
      }
    });

    // ── Nodes ──
    const nodeG = g.append("g");
    nodes.forEach((node, i) => {
      const pos = posMap.get(node.id)!;
      const ng = nodeG.append("g").attr("transform", `translate(${pos.x},${pos.y})`);

      // Background rect
      ng.append("rect")
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("rx", 8)
        .attr("fill", chartDefaults.bgCard)
        .attr("stroke", node.color)
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .transition()
        .delay(i * 40)
        .duration(chartDefaults.transitionMs)
        .attr("opacity", 1);

      // Color indicator bar (left edge)
      ng.append("rect")
        .attr("x", 0)
        .attr("y", 6)
        .attr("width", 3)
        .attr("height", NODE_H - 12)
        .attr("rx", 1.5)
        .attr("fill", node.color)
        .attr("opacity", 0)
        .transition()
        .delay(i * 40)
        .duration(chartDefaults.transitionMs)
        .attr("opacity", 1);

      // Label
      ng.append("text")
        .attr("x", NODE_W / 2)
        .attr("y", NODE_H / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", chartDefaults.textPrimary)
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .attr("opacity", 0)
        .text(node.label)
        .transition()
        .delay(i * 40 + 150)
        .duration(400)
        .attr("opacity", 1);
    });
  }, [isVisible, width, height]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        <svg ref={svgRef} width="100%" height={height} />
      </div>
    </div>
  );
}
