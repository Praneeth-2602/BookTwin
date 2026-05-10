"use client";

import { useMemo, useState } from "react";
import { approveReadingPlan, createReadingPlan, reviseReadingPlan } from "@/lib/feature-api";
import { PlanSession } from "@/lib/types";
import { PlanCalendar } from "./PlanCalendar";

export function PlanPanel() {
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, []);
  const [bookTitle, setBookTitle] = useState("Piranesi");
  const [minutes, setMinutes] = useState(30);
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [planId, setPlanId] = useState("");
  const [draft, setDraft] = useState<PlanSession[]>([]);
  const [finalPlan, setFinalPlan] = useState<PlanSession[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    setFinalPlan([]);
    try {
      const busy = skipWeekends ? ["saturday", "sunday"] : [];
      const result = await createReadingPlan(bookTitle, minutes, targetDate, busy);
      setPlanId(result.plan_id);
      setDraft(result.draft_plan);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Plan failed.");
    } finally {
      setLoading(false);
    }
  }

  async function finish(kind: "approve" | "revise") {
    if (!planId) return;
    setLoading(true);
    try {
      const result = kind === "approve"
        ? await approveReadingPlan(planId)
        : await reviseReadingPlan(planId, feedback);
      setFinalPlan(result.final_plan);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Plan update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.12)] outline-none" placeholder="Book title" />
      <label className="text-[11px] font-mono text-[rgba(26,20,16,0.55)]">
        {minutes} min/day
        <input className="block w-full mt-2" type="range" min={15} max={120} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
      </label>
      <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="px-3 py-2 text-[12px] font-mono bg-white rounded-sm outline-none" />
      <label className="flex items-center gap-2 text-[12px] font-mono text-[rgba(26,20,16,0.65)]">
        <input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} />
        Skip weekends
      </label>
      <button disabled={loading} onClick={create} className="px-3 py-2 bg-[#1a1410] text-[#f5f0e8] text-[11px] font-mono rounded-sm disabled:opacity-50">
        {loading ? "Generating..." : "Generate my plan"}
      </button>

      {draft.length > 0 && (
        <div className="flex flex-col gap-3">
          <PlanCalendar sessions={finalPlan.length ? finalPlan : draft} />
          {!finalPlan.length && (
            <>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} placeholder="Change anything about this plan..." className="px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.12)] outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={() => finish("approve")} className="flex-1 px-3 py-2 bg-white text-[11px] font-mono rounded-sm">Approve as-is</button>
                <button onClick={() => finish("revise")} className="flex-1 px-3 py-2 bg-[#d4380d] text-[#f5f0e8] text-[11px] font-mono rounded-sm">Apply feedback</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
