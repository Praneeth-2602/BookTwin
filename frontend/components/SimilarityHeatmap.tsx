"use client";

import { Fragment } from "react";
import { SimilarityResult } from "@/lib/types";

function color(value: number) {
  const v = Math.max(0, Math.min(1, value));
  const light = 96 - v * 54;
  return `hsl(277 54% ${light}%)`;
}

export function SimilarityHeatmap({ result }: { result: SimilarityResult }) {
  const n = result.titles.length;
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${n}, minmax(54px, 1fr))` }}>
        <div />
        {result.titles.map((title) => (
          <div key={title} className="text-[10px] font-mono text-[rgba(26,20,16,0.55)] truncate" title={title}>{title}</div>
        ))}
        {result.titles.map((row, i) => (
          <Fragment key={row}>
            <div key={`${row}-label`} className="text-[10px] font-mono text-[#1a1410] truncate pr-2" title={row}>{row}</div>
            {result.titles.map((col, j) => (
              <div
                key={`${row}-${col}`}
                title={`${row} × ${col}: ${result.matrix[i][j].toFixed(2)} — ${result.explanations[i][j]}`}
                className="h-12 rounded-sm border border-[rgba(26,20,16,0.08)] flex items-center justify-center text-[10px] font-mono text-[#1a1410]"
                style={{ backgroundColor: color(result.matrix[i][j]) }}
              >
                {result.matrix[i][j].toFixed(2)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
