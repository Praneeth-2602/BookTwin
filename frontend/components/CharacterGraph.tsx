"use client";

import { useEffect, useRef, useState } from "react";
import { GraphData, GraphNode, GraphLink } from "@/lib/types";

interface Props {
  data: GraphData;
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: "#d4380d",
  antagonist: "#1a1410",
  supporting: "#6b5e4e",
  minor: "#a89880",
};

const LINK_COLORS: Record<string, string> = {
  ally: "#0F6E56",
  rival: "#d4380d",
  romantic: "#c4748a",
  family: "#4a7fc4",
  mentor: "#8a6fc4",
  colleague: "#8a8a6f",
};

export function CharacterGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    // Dynamic import D3
    import("d3").then((d3) => {
      const svg = d3.select(svgRef.current!);
      svg.selectAll("*").remove();

      const width = svgRef.current!.clientWidth || 680;
      const height = 500;

      svg.attr("viewBox", `0 0 ${width} ${height}`);

      const g = svg.append("g");

      // Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 3])
        .on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);

      // Clone nodes/links for D3 mutation
      const nodes: any[] = data.nodes.map((n) => ({ ...n }));
      const links: any[] = data.links.map((l) => ({ ...l }));

      const simulation = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.4))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius((d: any) => d.size + 8));

      // Links
      const link = g
        .append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", (d: any) => LINK_COLORS[d.type] || "#aaa")
        .attr("stroke-width", (d: any) => d.strength * 0.8)
        .attr("stroke-opacity", 0.6)
        .attr("class", "graph-link")
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d: any) {
          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.source.id ?? d.source} ↔ ${d.target.id ?? d.target}\n${d.type} · strength ${d.strength}/5\n${d.description}`,
          });
        })
        .on("mouseleave", () => setTooltip(null));

      // Nodes
      const node = g
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", (d: any) => d.size)
        .attr("fill", (d: any) => ROLE_COLORS[d.role] || "#8a8a6f")
        .attr("fill-opacity", 0.85)
        .attr("stroke", "#f5f0e8")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d: any) {
          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.label}\n${d.role} · ${d.personality}\n${d.arc}`,
          });
          setHighlighted(d.id);
        })
        .on("mouseleave", () => {
          setTooltip(null);
          setHighlighted(null);
        })
        .call(
          d3.drag<any, any>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null; d.fy = null;
            })
        );

      // Labels
      const label = g
        .append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text((d: any) => d.label)
        .attr("font-size", (d: any) => Math.max(9, d.size * 0.55))
        .attr("font-family", "monospace")
        .attr("fill", "#1a1410")
        .attr("text-anchor", "middle")
        .attr("dy", (d: any) => d.size + 14)
        .style("pointer-events", "none")
        .style("user-select", "none");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
        label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
      });

      return () => simulation.stop();
    });
  }, [data]);

  if (data.error) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[13px] font-mono text-[rgba(26,20,16,0.5)]">
        {data.error}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          <div key={role} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-mono text-[rgba(26,20,16,0.6)] capitalize">{role}</span>
          </div>
        ))}
        <div className="w-px bg-[rgba(26,20,16,0.1)] mx-1" />
        {Object.entries(LINK_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ background: color }} />
            <span className="text-[10px] font-mono text-[rgba(26,20,16,0.6)] capitalize">{type}</span>
          </div>
        ))}
      </div>

      <div className="relative rounded-lg border border-[rgba(26,20,16,0.08)] overflow-hidden bg-[#faf8f3]">
        <svg ref={svgRef} className="w-full" style={{ height: 500 }} />

        {tooltip && (
          <div
            className="absolute z-10 bg-[#1a1410] text-[#f5f0e8] text-[11px] font-mono px-3 py-2 rounded-md pointer-events-none max-w-[220px] whitespace-pre-wrap leading-relaxed shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-3 text-[10px] font-mono text-[rgba(26,20,16,0.4)]">
        <span>{data.character_count} characters</span>
        <span>{data.relationship_count} relationships</span>
        <span>Drag nodes · Scroll to zoom</span>
      </div>
    </div>
  );
}
