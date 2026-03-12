"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ChordData } from "@/lib/charts/types";
import { categoricalColors, chartDefaults } from "@/lib/charts/theme";
import { useResponsiveSize } from "@/lib/charts/useResponsiveSize";
import { useIntersectionObserver } from "@/lib/charts/useIntersectionObserver";

interface Props {
  data: ChordData;
  className?: string;
}

export default function ChordDiagram({ data, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerRef, { width }] = useResponsiveSize();
  const [visRef, isVisible] = useIntersectionObserver();

  const size = Math.min(width || 500, 600);
  const outerRadius = size / 2 - 80;
  const innerRadius = outerRadius - 20;

  useEffect(() => {
    if (!svgRef.current || !isVisible || !data.modules.length || size <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `${-size / 2} ${-size / 2} ${size} ${size}`)
      .append("g");

    const chord = d3
      .chord()
      .padAngle(0.04)
      .sortSubgroups(d3.descending);

    const chords = chord(data.matrix);

    const arc = d3.arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius);

    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius);

    const color = (i: number) =>
      data.modules[i]?.color || categoricalColors[i % categoricalColors.length];

    // Arcs (module segments)
    const groupG = g
      .append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    groupG
      .append("path")
      .attr("d", (d) => arc(d) ?? "")
      .attr("fill", (d) => color(d.index))
      .attr("stroke", chartDefaults.bgPrimary)
      .attr("stroke-width", 1.5)
      .style("opacity", 0)
      .transition()
      .duration(chartDefaults.transitionMs)
      .style("opacity", 1);

    // Labels
    groupG
      .append("text")
      .each((d) => {
        (d as unknown as { angle: number }).angle =
          (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", "0.35em")
      .attr("transform", (d) => {
        const angle = (d as unknown as { angle: number }).angle;
        return `rotate(${(angle * 180) / Math.PI - 90}) translate(${outerRadius + 16}) ${
          angle > Math.PI ? "rotate(180)" : ""
        }`;
      })
      .attr("text-anchor", (d) =>
        (d as unknown as { angle: number }).angle > Math.PI ? "end" : "start",
      )
      .attr("fill", chartDefaults.textSecondary)
      .attr("font-size", "11px")
      .text((d) => data.modules[d.index]?.name ?? "");

    // Ribbons
    g.append("g")
      .attr("fill-opacity", 0.5)
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", (d) => ribbon(d) ?? "")
      .attr("fill", (d) => color(d.source.index))
      .attr("stroke", "none")
      .style("opacity", 0)
      .on("mouseenter", function (event, d) {
        d3.select(this).transition().duration(150).attr("fill-opacity", 0.85);
        showTooltip(
          event,
          `${data.modules[d.source.index]?.name} → ${data.modules[d.target.index]?.name}: ${d.source.value}`,
        );
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(150).attr("fill-opacity", 0.5);
        hideTooltip();
      })
      .transition()
      .delay((_, i) => i * 20)
      .duration(chartDefaults.transitionMs)
      .style("opacity", 1);
  }, [data, isVisible, size, innerRadius, outerRadius]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={visRef}>
        <svg ref={svgRef} width="100%" height={size} />
        <div id="chord-tooltip" className="chart-tooltip" />
      </div>
    </div>
  );
}

function showTooltip(event: MouseEvent, text: string) {
  const tip = document.getElementById("chord-tooltip");
  if (!tip) return;
  tip.textContent = text;
  tip.style.left = `${event.pageX + 12}px`;
  tip.style.top = `${event.pageY - 28}px`;
  tip.classList.add("visible");
}

function hideTooltip() {
  const tip = document.getElementById("chord-tooltip");
  if (tip) tip.classList.remove("visible");
}
