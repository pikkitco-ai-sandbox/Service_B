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

/* ── Node & edge definitions ── */

interface EcoNode {
  id: string;
  label: string;
  sub: string;
  color: string;
  /** Center X as fraction of drawing width [0-1] */
  fx: number;
  /** Top Y as fraction of drawing height [0-1] */
  fy: number;
  badge?: string;
}

interface EcoEdge {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
  color?: string;
}

const NODE_W = 164;
const NODE_H = 50;

/*
 * Four-layer layout (top → bottom):
 *   External Sources  →  Gateway  →  Agent Backends  →  Knowledge & Tooling
 *
 * The dashed separator between Agents and Knowledge represents the
 * intentional split between runtime (live support) and tooling (alignment).
 */

const nodes: EcoNode[] = [
  // ── Layer 0: External Sources
  { id: "slack",     label: "Slack",           sub: "Events · Commands · UI",         color: palette.rose,   fx: 0.25, fy: 0.04 },
  { id: "linear",    label: "Linear API",      sub: "GraphQL System of Record",       color: palette.purple, fx: 0.65, fy: 0.04 },

  // ── Layer 1: Gateway
  { id: "service_b", label: "Service_B",       sub: "Next.js 14 · Vercel · Node/TS",  color: palette.blue,   fx: 0.45, fy: 0.25, badge: "GATEWAY" },

  // ── Layer 2: Agent Backends
  { id: "dummy",     label: "Dummy_Agent",     sub: "Python · Custom Pipeline",       color: palette.green,  fx: 0.22, fy: 0.50, badge: "SUPPORT OPS" },
  { id: "mislink",   label: "Mislink_Agent",   sub: "Python · LangGraph",             color: palette.amber,  fx: 0.68, fy: 0.50, badge: "SPECIALIST" },

  // ── Layer 3: Knowledge & Tooling
  { id: "docs",      label: "Documentation",   sub: "CI Auto-Synced · kb/ Submodule", color: palette.teal,   fx: 0.22, fy: 0.82 },
  { id: "vault",     label: "Vault",           sub: "Claude Code · Atomic Specs",     color: palette.teal,   fx: 0.68, fy: 0.82 },
];

const edges: EcoEdge[] = [
  // Sources → Gateway
  { from: "slack",     to: "service_b", label: "events, commands" },
  { from: "linear",    to: "service_b", label: "ticket context" },

  // Gateway → Agents
  { from: "service_b", to: "dummy",     label: "POST /api/process" },
  { from: "service_b", to: "mislink",   label: "POST /api/process" },

  // Agent loose coupling
  { from: "dummy", to: "mislink", label: "via Linear label", style: "dashed", color: palette.amber },
];

export default function EcosystemMap({ height = 620, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (!svgRef.current || !isVisible || !width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 36, right: 20, bottom: 16, left: 20 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Compute pixel positions (node centered on fx) ──
    const posMap = new Map<string, { cx: number; cy: number; x: number; y: number }>();
    nodes.forEach((n) => {
      const cx = n.fx * w;
      const y = n.fy * h;
      posMap.set(n.id, { cx, cy: y + NODE_H / 2, x: cx - NODE_W / 2, y });
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
    makeArrow("eco-arrow-muted", chartDefaults.textMuted);
    makeArrow("eco-arrow-amber", palette.amber);

    // ── Dashed separator between runtime and knowledge layers ──
    const sepY = 0.70 * h;
    g.append("line")
      .attr("x1", 0)
      .attr("y1", sepY)
      .attr("x2", w)
      .attr("y2", sepY)
      .attr("stroke", chartDefaults.border)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0)
      .transition()
      .delay(400)
      .duration(chartDefaults.transitionMs)
      .attr("opacity", 0.7);

    g.append("text")
      .attr("x", w / 2)
      .attr("y", sepY - 8)
      .attr("text-anchor", "middle")
      .attr("fill", chartDefaults.textMuted)
      .attr("font-size", "9px")
      .attr("letter-spacing", "0.1em")
      .attr("opacity", 0)
      .text("KNOWLEDGE & TOOLING LAYER")
      .transition()
      .delay(500)
      .duration(400)
      .attr("opacity", 0.8);

    // ── Edges (behind nodes) ──
    const edgeG = g.append("g");

    edges.forEach((edge, i) => {
      const src = posMap.get(edge.from);
      const tgt = posMap.get(edge.to);
      if (!src || !tgt) return;

      const isDashed = edge.style === "dashed";
      const edgeColor = edge.color ?? chartDefaults.textMuted;
      const arrowId = edge.color === palette.amber ? "eco-arrow-amber" : "eco-arrow-muted";

      const dx = tgt.cx - src.cx;
      const dy = tgt.cy - src.cy;

      let x1: number, y1: number, x2: number, y2: number;
      let pathD: string;

      if (Math.abs(dy) < NODE_H) {
        // Horizontal edge (same layer) — right side → left side
        x1 = src.x + NODE_W;
        y1 = src.cy;
        x2 = tgt.x;
        y2 = tgt.cy;
        const mx = (x1 + x2) / 2;
        pathD = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      } else {
        // Vertical edge (different layers) — bottom center → top center
        x1 = src.cx;
        y1 = src.y + NODE_H;
        x2 = tgt.cx;
        y2 = tgt.y;
        const my = (y1 + y2) / 2;
        pathD = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
      }

      edgeG
        .append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", edgeColor)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", isDashed ? "5,4" : "none")
        .attr("stroke-opacity", isDashed ? 0.5 : 0.35)
        .attr("marker-end", `url(#${arrowId})`)
        .attr("opacity", 0)
        .transition()
        .delay(i * 80 + 300)
        .duration(chartDefaults.transitionMs)
        .attr("opacity", 1);

      // Edge label
      if (edge.label) {
        const lx = (x1 + x2) / 2;
        const ly = Math.abs(dy) < NODE_H
          ? (y1 + y2) / 2 - 10
          : (y1 + y2) / 2 - 6;

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
          .delay(i * 80 + 600)
          .duration(400)
          .attr("opacity", isDashed ? 0.7 : 0.85);
      }
    });

    // ── Nodes ──
    const nodeG = g.append("g");

    nodes.forEach((node, i) => {
      const pos = posMap.get(node.id)!;
      const ng = nodeG.append("g").attr("transform", `translate(${pos.x},${pos.y})`);

      // Badge (above node)
      if (node.badge) {
        const badgeW = node.badge.length * 6.5 + 16;
        ng.append("rect")
          .attr("x", NODE_W / 2 - badgeW / 2)
          .attr("y", -20)
          .attr("width", badgeW)
          .attr("height", 16)
          .attr("rx", 8)
          .attr("fill", node.color)
          .attr("fill-opacity", 0.15)
          .attr("stroke", node.color)
          .attr("stroke-width", 0.5)
          .attr("stroke-opacity", 0.4)
          .attr("opacity", 0)
          .transition()
          .delay(i * 50 + 100)
          .duration(chartDefaults.transitionMs)
          .attr("opacity", 1);

        ng.append("text")
          .attr("x", NODE_W / 2)
          .attr("y", -9)
          .attr("text-anchor", "middle")
          .attr("fill", node.color)
          .attr("font-size", "8px")
          .attr("font-weight", "600")
          .attr("letter-spacing", "0.08em")
          .attr("opacity", 0)
          .text(node.badge)
          .transition()
          .delay(i * 50 + 150)
          .duration(400)
          .attr("opacity", 1);
      }

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
        .delay(i * 50)
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
        .delay(i * 50)
        .duration(chartDefaults.transitionMs)
        .attr("opacity", 1);

      // Main label
      ng.append("text")
        .attr("x", NODE_W / 2)
        .attr("y", NODE_H / 2 - 6)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", chartDefaults.textPrimary)
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("opacity", 0)
        .text(node.label)
        .transition()
        .delay(i * 50 + 150)
        .duration(400)
        .attr("opacity", 1);

      // Sub-label (tech stack)
      ng.append("text")
        .attr("x", NODE_W / 2)
        .attr("y", NODE_H / 2 + 10)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", chartDefaults.textMuted)
        .attr("font-size", "9px")
        .attr("opacity", 0)
        .text(node.sub)
        .transition()
        .delay(i * 50 + 200)
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
