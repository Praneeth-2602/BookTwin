"use client";

import { DebateTurn } from "@/lib/types";

export function DebateMessage({ turn }: { turn: DebateTurn }) {
  const judge = turn.role === "judge";
  const right = turn.role === "advocate_b";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] px-4 py-3 rounded-sm text-[13px] leading-relaxed ${judge ? "bg-[#1a1410] text-[#f5f0e8] font-serif" : right ? "bg-white text-[#1a1410] border border-[rgba(26,20,16,0.08)]" : "bg-[#f7d6c4] text-[#1a1410]"}`}>
        <div className={`text-[9px] uppercase tracking-[0.16em] mb-2 ${judge ? "text-[rgba(245,240,232,0.55)]" : "text-[rgba(26,20,16,0.45)]"}`}>
          {judge ? "Judge" : turn.role === "advocate_a" ? "Advocate A" : "Advocate B"}
        </div>
        {turn.content}
      </div>
    </div>
  );
}
