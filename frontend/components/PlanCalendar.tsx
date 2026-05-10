"use client";

import { PlanSession } from "@/lib/types";

export function PlanCalendar({ sessions }: { sessions: PlanSession[] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {sessions.map((item) => (
        <div key={`${item.date}-${item.pages_start}`} className="bg-white border border-[rgba(26,20,16,0.08)] rounded-sm px-3 py-2">
          <div className="flex justify-between gap-3">
            <span className="text-[11px] font-mono text-[#1a1410]">{new Date(item.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="text-[10px] font-mono text-[rgba(26,20,16,0.45)]">~{item.session_minutes} min</span>
          </div>
          <div className="text-[13px] font-serif text-[#1a1410] mt-1">pp. {item.pages_start}-{item.pages_end}</div>
          <div className="text-[11px] text-[rgba(26,20,16,0.5)] mt-1">{item.note}</div>
        </div>
      ))}
    </div>
  );
}
