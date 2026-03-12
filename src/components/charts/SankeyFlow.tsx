"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyNode as D3SankeyNode,
  type SankeyLink as D3SankeyLink,
} from "d3-sankey";
import type { SankeyData } from "@/lib/charts/types";
import { categoricalColors, chartDefaults } from "@/lib/charts/theme";
import { useResponsiveSize } from "@/lib/charts/useResponsiveSize";
import { useIntersectionObserver } from "@/lib/charts/useIntersectionObserver";

interface Props {
  data: SankeyData;
  height?: number;
  className?: string;
}

type NodeExtra = { id: string; label: string; color?: string };
type LinkExtra = { source: string; target: string; value: number };
type SNode = D3SankeyNode<NodeExtra, LinkExtra>;
type SLink = D3SankeyLink<NodeExtra, LinkExtra>;

export default function SankeyFlow({ data, height = 500, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (!svgRef.current || !isVisible || !data.nodes.length || !width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 16, right: 140, bottom: 16, left: 140 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build index map
    const nodeMap = new Map(data.nodes.map((n, i) => [n.id, i]));

    const sankeyLayout = d3Sankey<NodeExtra, LinkExtra>()
      .nodeId((d) => (d as unknown as { id: string }).id)
      .nodeWidth(14)
      .nodePadding(12)
      .extent([
        [0, 0],
        [w, h],
      ]);

    const graph = sankeyLayout({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    });

    const color = (i: number) => categoricalColors[i % categoricalColors.length];

    // Gradient defs for links
    const defs = svg.append("defs");
    graph.links.forEach((link, i) => {
      const sourceNode = link.source as SNode;
      const targetNode = link.target as SNode;
      const grad = defs
        .append("linearGradient")
        .attr("id", `link-grad-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", sourceNode.x1 ?? 0)
        .attr("x2", targetNode.x0 ?? 0);
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr(
          "stop-color",
          sourceNode.color ?? color(nodeMap.get(sourceNode.id ?? "") ?? 0),
        );
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr(
          "stop-color",
          targetNode.color ?? color(nodeMap.get(targetNode.id ?? "") ?? 0),
        );
    });

    // Links
    g.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (_, i) => `url(#link-grad-${i})`)
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", (d) => Math.max(1, (d as SLink).width ?? 0))
      .style("opacity", 0)
      .on("mouseenter", function () {
        d3.select(this).transition().duration(150).attr("stroke-opacity", 0.7);
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(150).attr("stroke-opacity", 0.35);
      })
      .transition()
      .delay((_, i) => i * 30)
      .duration(chartDefaults.transitionMs)
      .style("opacity", 1);

    // Nodes
    g.append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", (d) => (d as SNode).x0 ?? 0)
      .attr("y", (d) => (d as SNode).y0 ?? 0)
      .attr("width", (d) => ((d as SNode).x1 ?? 0) - ((d as SNode).x0 ?? 0))
      .attr("height", (d) =>
        Math.max(1, ((d as SNode).y1 ?? 0) - ((d as SNode).y0 ?? 0)),
      )
      .attr("fill", (d, i) => (d as SNode).color ?? color(i))
      .attr("rx", 2)
      .style("opacity", 0)
      .transition()
      .duration(chartDefaults.transitionMs)
      .style("opacity", 1);

    // Labels
    g.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) => {
        const node = d as SNode;
        return (node.x0 ?? 0) < w / 2
          ? (node.x1 ?? 0) + 8
          : (node.x0 ?? 0) - 8;
      })
      .attr("y", (d) => {
        const node = d as SNode;
        return ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) =>
        ((d as SNode).x0 ?? 0) < w / 2 ? "start" : "end",
      )
      .attr("fill", chartDefaults.textSecondary)
      .attr("font-size", "11px")
      .text((d) => (d as SNode).label ?? "");
  }, [data, isVisible, width, height]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        <svg ref={svgRef} width="100%" height={height} />
      </div>
    </div>
  );
}
