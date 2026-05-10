"use client";

import { useMemo, useState } from "react";
import { PaceEstimate } from "@/lib/types";
import { estimatePace } from "@/lib/feature-api";

const WPM = { slow: 150, medium: 250, fast: 375 };

export function PaceEstimator({ bookTitle }: { bookTitle: string }) {
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [minutes, setMinutes] = useState(30);
  const [estimate, setEstimate] = useState<PaceEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadEstimate(nextSpeed = speed) {
    setLoading(true);
    try {
      setEstimate(await estimatePace(bookTitle, nextSpeed));
    } finally {
      setLoading(false);
    }
  }

  const live = useMemo(() => {
    if (!estimate) return null;
    const wpm = WPM[speed];
    const totalDays = Math.max(1, Math.ceil((estimate.word_count / wpm) / minutes));
    const timeline = estimate.timeline.map((part) => {
      const words = estimate.word_count / estimate.timeline.length;
      return { ...part, days: Math.max(1, Math.ceil((words / wpm) / minutes)) };
    });
    return { totalDays, timeline };
  }, [estimate, minutes, speed]);

  return (
    <div className="border-t border-[rgba(26,20,16,0.08)] pt-5">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && !estimate) loadEstimate();
        }}
        className="w-full text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#d4380d]"
      >
        How long will it take me?
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex gap-2">
            {(["slow", "medium", "fast"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSpeed(s); loadEstimate(s); }}
                className={`px-3 py-1.5 rounded-sm text-[11px] font-mono ${speed === s ? "bg-[#1a1410] text-[#f5f0e8]" : "bg-white text-[rgba(26,20,16,0.6)]"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-2 text-[11px] font-mono text-[rgba(26,20,16,0.55)]">
            {minutes} min/day
            <input type="range" min={15} max={120} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          </label>

          {loading && <div className="text-[12px] font-mono text-[rgba(26,20,16,0.45)]">Estimating...</div>}
          {estimate && live && (
            <>
              <div className="text-[13px] font-serif text-[#1a1410]">
                At your reading pace: ~{live.totalDays} days ({minutes} min/day)
              </div>
              <div className="flex overflow-hidden rounded-sm border border-[rgba(26,20,16,0.08)] bg-white">
                {live.timeline.map((part) => (
                  <div
                    key={part.label}
                    className="min-h-[54px] flex flex-col justify-center px-2 border-r last:border-r-0 border-[rgba(26,20,16,0.08)] bg-[#f7d6c4]"
                    style={{ flexGrow: part.days }}
                    title={`Pages ${part.page_start}-${part.page_end}`}
                  >
                    <span className="text-[10px] font-mono text-[#1a1410]">{part.label}</span>
                    <span className="text-[10px] text-[rgba(26,20,16,0.55)]">{part.days} days</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
