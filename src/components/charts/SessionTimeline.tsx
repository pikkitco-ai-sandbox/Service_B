"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TimelineData } from "@/lib/charts/types";
import { stageColors, chartDefaults } from "@/lib/charts/theme";
import { useResponsiveSize } from "@/lib/charts/useResponsiveSize";
import { useIntersectionObserver } from "@/lib/charts/useIntersectionObserver";

interface Props {
  data: TimelineData;
  rowHeight?: number;
  className?: string;
}

export default function SessionTimeline({ data, rowHeight = 36, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  const margin = { top: 32, right: 24, bottom: 40, left: 120 };
  const h = margin.top + data.rows.length * rowHeight + margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !isVisible || !data.rows.length || !width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = width - margin.left - margin.right;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${h}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, data.totalDuration])
      .range([0, w]);

    // Grid lines
    const ticks = xScale.ticks(8);
    g.append("g")
      .selectAll("line")
      .data(ticks)
      .join("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", data.rows.length * rowHeight)
      .attr("stroke", chartDefaults.border)
      .attr("stroke-dasharray", "2,4");

    // Time axis
    g.append("g")
      .attr("transform", `translate(0,${data.rows.length * rowHeight + 8})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => formatMs(d as number)),
      )
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis.selectAll("text").attr("fill", chartDefaults.textMuted).attr("font-size", "10px"),
      )
      .call((axis) => axis.selectAll("line").attr("stroke", chartDefaults.border));

    // Row labels
    g.append("g")
      .selectAll("text")
      .data(data.rows)
      .join("text")
      .attr("x", -12)
      .attr("y", (_, i) => i * rowHeight + rowHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", chartDefaults.textSecondary)
      .attr("font-size", "12px")
      .text((d) => d.label);

    // Segments
    data.rows.forEach((row, rowIdx) => {
      g.append("g")
        .selectAll("rect")
        .data(row.segments)
        .join("rect")
        .attr("x", (d) => xScale(d.start))
        .attr("y", rowIdx * rowHeight + 4)
        .attr("height", rowHeight - 8)
        .attr("rx", 3)
        .attr("fill", (d) => d.color ?? stageColors[d.stage] ?? chartDefaults.textMuted)
        .attr("width", 0)
        .on("mouseenter", function (event, d) {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
          showTooltip(event, d.tooltip ?? `${d.stage}: ${formatMs(d.end - d.start)}`);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("stroke", "none");
          hideTooltip();
        })
        .transition()
        .delay((_, i) => i * 60)
        .duration(chartDefaults.transitionMs)
        .attr("width", (d) => Math.max(2, xScale(d.end) - xScale(d.start)));
    });

    // Scan line animation
    const scanLine = g
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", -4)
      .attr("y2", data.rows.length * rowHeight + 4)
      .attr("stroke", chartDefaults.textPrimary)
      .attr("stroke-width", 1)
      .attr("opacity", 0.4);

    scanLine
      .transition()
      .duration(2000)
      .delay(chartDefaults.transitionMs)
      .ease(d3.easeLinear)
      .attr("x1", w)
      .attr("x2", w)
      .transition()
      .duration(300)
      .attr("opacity", 0);
  }, [data, isVisible, width, h, margin.left, margin.right, margin.top, rowHeight]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        <svg ref={svgRef} width="100%" height={h} />
        <div id="timeline-tooltip" className="chart-tooltip" />
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function showTooltip(event: MouseEvent, text: string) {
  const tip = document.getElementById("timeline-tooltip");
  if (!tip) return;
  tip.textContent = text;
  tip.style.left = `${event.pageX + 12}px`;
  tip.style.top = `${event.pageY - 28}px`;
  tip.classList.add("visible");
}

function hideTooltip() {
  const tip = document.getElementById("timeline-tooltip");
  if (tip) tip.classList.remove("visible");
}
