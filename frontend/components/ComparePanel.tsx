"use client";

import { useState } from "react";
import { fetchSimilarityMatrix } from "@/lib/feature-api";
import { SimilarityResult } from "@/lib/types";
import { SimilarityHeatmap } from "./SimilarityHeatmap";

export function ComparePanel() {
  const [titles, setTitles] = useState(["Normal People", "Project Hail Mary", "Sapiens"]);
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function compare() {
    setLoading(true);
    try {
      setResult(await fetchSimilarityMatrix(titles.filter(Boolean)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Similarity failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      <div>
        <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.5)] mb-3">Compare books</div>
        <div className="flex flex-col gap-2">
          {titles.map((title, i) => (
            <input
              key={i}
              value={title}
              onChange={(e) => setTitles((prev) => prev.map((t, idx) => idx === i ? e.target.value : t))}
              className="px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.12)] outline-none focus:border-[#1a1410]"
              placeholder={`Book ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button disabled={titles.length >= 6} onClick={() => setTitles((p) => [...p, ""])} className="px-3 py-2 bg-white text-[11px] font-mono rounded-sm disabled:opacity-40">Add</button>
        <button disabled={titles.length <= 2} onClick={() => setTitles((p) => p.slice(0, -1))} className="px-3 py-2 bg-white text-[11px] font-mono rounded-sm disabled:opacity-40">Remove</button>
        <button disabled={loading} onClick={compare} className="flex-1 px-3 py-2 bg-[#1a1410] text-[#f5f0e8] text-[11px] font-mono rounded-sm disabled:opacity-50">
          {loading ? "Comparing..." : "Build heatmap"}
        </button>
      </div>
      {result && <SimilarityHeatmap result={result} />}
    </div>
  );
}
