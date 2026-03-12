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

/* ── Step data for the two flow columns ── */

interface FlowStep {
  num: number;
  title: string;
  desc: string;
  color: string;
  /** Center Y as fraction of drawing height [0-1] */
  fy: number;
}

interface FlowColumn {
  title: string;
  subtitle: string;
  /** Center X as fraction of drawing width [0-1] */
  fx: number;
  steps: FlowStep[];
}

const columns: FlowColumn[] = [
  {
    title: "Standard Slack Flow",
    subtitle: "Event → Gateway → Agent → Human",
    fx: 0.27,
    steps: [
      { num: 1, title: "Event Received",       desc: "Validates Slack signature, checks feature gates",         color: palette.blue,   fy: 0.14 },
      { num: 2, title: "Async Continuation",    desc: "Ack Slack immediately, waitUntil runs background",       color: palette.purple, fy: 0.36 },
      { num: 3, title: "Backend Processing",    desc: "Routes to agent POST /api/process, saves run state",     color: palette.green,  fy: 0.58 },
      { num: 4, title: "Human Approval",        desc: "Block Kit card — Approve / Reject / Modify",            color: palette.amber,  fy: 0.80 },
    ],
  },
  {
    title: "Specialist Routing",
    subtitle: "Dummy → Linear label → Mislink picks up",
    fx: 0.73,
    steps: [
      { num: 1, title: "Intake & Classification", desc: "Dummy_Agent classifies with LLM + keywords",          color: palette.green,  fy: 0.14 },
      { num: 2, title: "Linear Tagging",           desc: "Applies mislink-agent label in Linear, exits",       color: palette.blue,   fy: 0.42 },
      { num: 3, title: "Specialist Pickup",         desc: "Mislink_Agent filters by label, runs pipeline",     color: palette.amber,  fy: 0.70 },
    ],
  },
];

const STEP_H = 56;
const BADGE_R = 14;

export default function RequestLifecycle({ height = 540, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (!svgRef.current || !isVisible || !width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 16, right: 20, bottom: 16, left: 20 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const stepW = Math.min(280, w * 0.38);

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Defs: arrowheads ──
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "flow-arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,2 L8,5 L0,8 z")
      .attr("fill", chartDefaults.textMuted);

    // ── Vertical divider between columns ──
    g.append("line")
      .attr("x1", w / 2)
      .attr("y1", 0)
      .attr("x2", w / 2)
      .attr("y2", h)
      .attr("stroke", chartDefaults.border)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.4);

    // ── Render each column ──
    let globalIdx = 0;

    columns.forEach((col) => {
      const cx = col.fx * w;
      const colG = g.append("g");

      // Column title
      colG
        .append("text")
        .attr("x", cx)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("fill", chartDefaults.textPrimary)
        .attr("font-size", "13px")
        .attr("font-weight", "600")
        .text(col.title);

      // Column subtitle
      colG
        .append("text")
        .attr("x", cx)
        .attr("y", 26)
        .attr("text-anchor", "middle")
        .attr("fill", chartDefaults.textMuted)
        .attr("font-size", "10px")
        .text(col.subtitle);

      // Steps
      col.steps.forEach((step, si) => {
        const idx = globalIdx++;
        const sy = step.fy * h;
        const sx = cx - stepW / 2;

        // Connecting arrow from previous step
        if (si > 0) {
          const prevStep = col.steps[si - 1];
          const prevY = prevStep.fy * h + STEP_H;
          const curY = sy;

          colG
            .append("line")
            .attr("x1", cx)
            .attr("y1", prevY + 2)
            .attr("x2", cx)
            .attr("y2", curY - 2)
            .attr("stroke", chartDefaults.textMuted)
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.3)
            .attr("marker-end", "url(#flow-arrow)")
            .attr("opacity", 0)
            .transition()
            .delay(idx * 100 + 200)
            .duration(chartDefaults.transitionMs)
            .attr("opacity", 1);
        }

        const sg = colG.append("g").attr("transform", `translate(${sx},${sy})`);

        // Step background rect
        sg.append("rect")
          .attr("width", stepW)
          .attr("height", STEP_H)
          .attr("rx", 10)
          .attr("fill", chartDefaults.bgCard)
          .attr("stroke", step.color)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0)
          .transition()
          .delay(idx * 100)
          .duration(chartDefaults.transitionMs)
          .attr("opacity", 1);

        // Step number badge (circle)
        sg.append("circle")
          .attr("cx", BADGE_R + 8)
          .attr("cy", STEP_H / 2)
          .attr("r", BADGE_R)
          .attr("fill", step.color)
          .attr("fill-opacity", 0.2)
          .attr("stroke", step.color)
          .attr("stroke-width", 1)
          .attr("opacity", 0)
          .transition()
          .delay(idx * 100 + 50)
          .duration(chartDefaults.transitionMs)
          .attr("opacity", 1);

        sg.append("text")
          .attr("x", BADGE_R + 8)
          .attr("y", STEP_H / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("fill", step.color)
          .attr("font-size", "12px")
          .attr("font-weight", "700")
          .attr("opacity", 0)
          .text(String(step.num))
          .transition()
          .delay(idx * 100 + 80)
          .duration(400)
          .attr("opacity", 1);

        // Step title
        sg.append("text")
          .attr("x", BADGE_R * 2 + 20)
          .attr("y", STEP_H / 2 - 7)
          .attr("dy", "0.35em")
          .attr("fill", chartDefaults.textPrimary)
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .attr("opacity", 0)
          .text(step.title)
          .transition()
          .delay(idx * 100 + 120)
          .duration(400)
          .attr("opacity", 1);

        // Step description
        sg.append("text")
          .attr("x", BADGE_R * 2 + 20)
          .attr("y", STEP_H / 2 + 9)
          .attr("dy", "0.35em")
          .attr("fill", chartDefaults.textSecondary)
          .attr("font-size", "9px")
          .attr("opacity", 0)
          .text(step.desc)
          .transition()
          .delay(idx * 100 + 160)
          .duration(400)
          .attr("opacity", 1);
      });
    });

    // ── Callout box between columns ──
    const calloutY = 0.92 * h;
    const calloutW = Math.min(360, w * 0.55);
    const calloutH = 32;
    const calloutX = w / 2 - calloutW / 2;

    g.append("rect")
      .attr("x", calloutX)
      .attr("y", calloutY)
      .attr("width", calloutW)
      .attr("height", calloutH)
      .attr("rx", 6)
      .attr("fill", palette.amber)
      .attr("fill-opacity", 0.08)
      .attr("stroke", palette.amber)
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3)
      .attr("opacity", 0)
      .transition()
      .delay(800)
      .duration(chartDefaults.transitionMs)
      .attr("opacity", 1);

    g.append("text")
      .attr("x", w / 2)
      .attr("y", calloutY + calloutH / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", palette.amber)
      .attr("font-size", "10px")
      .attr("opacity", 0)
      .text("Loose coupling — no direct agent-to-agent calls")
      .transition()
      .delay(900)
      .duration(400)
      .attr("opacity", 0.9);
  }, [isVisible, width, height]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        <svg ref={svgRef} width="100%" height={height} />
      </div>
    </div>
  );
}
