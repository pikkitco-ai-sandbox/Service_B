"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { CircleNode } from "@/lib/charts/types";
import { categoricalColors, chartDefaults } from "@/lib/charts/theme";
import { useResponsiveSize } from "@/lib/charts/useResponsiveSize";
import { useIntersectionObserver } from "@/lib/charts/useIntersectionObserver";

interface Props {
  data: CircleNode;
  className?: string;
}

type HNode = d3.HierarchyCircularNode<CircleNode>;

export default function PackedCircleExplorer({ data, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();
  const [focus, setFocus] = useState<HNode | null>(null);
  const [zoomKey, setZoomKey] = useState(0);

  const size = Math.min(width || 500, 700);

  useEffect(() => {
    if (!svgRef.current || !isVisible || !size) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = d3.pack<CircleNode>().size([size, size]).padding(4);
    const packed = pack(root);

    const g = svg
      .attr("viewBox", `0 0 ${size} ${size}`)
      .append("g");

    const topLevelNames = (root.children ?? []).map((c) => c.data.name);
    const colorScale = (name: string) => {
      const idx = topLevelNames.indexOf(name);
      return idx >= 0 ? categoricalColors[idx % categoricalColors.length] : chartDefaults.textMuted;
    };

    const ancestor = (node: HNode): string => {
      let n = node;
      while (n.parent && n.parent !== packed) n = n.parent;
      return n.data.name;
    };

    // Circles
    const circles = g
      .selectAll("circle")
      .data(packed.descendants())
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", (d) => {
        if (d === packed) return "none";
        if (d.children) return d3.color(colorScale(ancestor(d)))?.darker(0.8)?.toString() ?? chartDefaults.bgCard;
        return d.data.color ?? colorScale(ancestor(d));
      })
      .attr("fill-opacity", (d) => (d.children ? 0.15 : 0.7))
      .attr("stroke", (d) => (d.children ? colorScale(ancestor(d)) : "none"))
      .attr("stroke-width", (d) => (d === packed ? 0 : d.children ? 1 : 0))
      .attr("r", 0)
      .style("cursor", (d) => (d.children ? "pointer" : "default"))
      .on("click", (_, d) => {
        if (d.children) zoomTo(d);
      })
      .on("mouseenter", function (event, d) {
        if (!d.children) {
          d3.select(this).attr("fill-opacity", 1);
          showTooltip(event, `${d.data.name}: ${d.value ?? 0}`);
        }
      })
      .on("mouseleave", function (_, d) {
        if (!d.children) {
          d3.select(this).attr("fill-opacity", 0.7);
          hideTooltip();
        }
      });

    circles
      .transition()
      .delay((_, i) => i * 5)
      .duration(chartDefaults.transitionMs)
      .attr("r", (d) => d.r);

    // Labels for visible nodes
    g.selectAll("text")
      .data(packed.descendants().filter((d) => !d.children && d.r > 18))
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", chartDefaults.textPrimary)
      .attr("font-size", (d) => `${Math.min(12, d.r / 3)}px`)
      .attr("pointer-events", "none")
      .text((d) => d.data.name);

    function zoomTo(node: HNode) {
      const k = size / (node.r * 2);
      const cx = node.x;
      const cy = node.y;

      circles
        .transition()
        .duration(500)
        .attr("cx", (d) => (d.x - cx) * k + size / 2)
        .attr("cy", (d) => (d.y - cy) * k + size / 2)
        .attr("r", (d) => d.r * k);

      g.selectAll("text")
        .transition()
        .duration(500)
        .attr("x", (d: unknown) => ((d as HNode).x - cx) * k + size / 2)
        .attr("y", (d: unknown) => ((d as HNode).y - cy) * k + size / 2);

      setFocus(node);
    }

    setFocus(packed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isVisible, size, zoomKey]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        {focus && focus.parent && (
          <button
            onClick={() => setZoomKey((k) => k + 1)}
            className="mb-2 text-sm text-[var(--color-accent-blue)] hover:underline"
          >
            ← Reset View
          </button>
        )}
        <svg ref={svgRef} width="100%" height={size} />
        <div id="circle-tooltip" className="chart-tooltip" />
      </div>
    </div>
  );
}

function showTooltip(event: MouseEvent, text: string) {
  const tip = document.getElementById("circle-tooltip");
  if (!tip) return;
  tip.textContent = text;
  tip.style.left = `${event.pageX + 12}px`;
  tip.style.top = `${event.pageY - 28}px`;
  tip.classList.add("visible");
}

function hideTooltip() {
  const tip = document.getElementById("circle-tooltip");
  if (tip) tip.classList.remove("visible");
}
