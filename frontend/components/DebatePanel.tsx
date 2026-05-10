"use client";

import { useState } from "react";
import { streamDebate } from "@/lib/feature-api";
import { DebateTurn } from "@/lib/types";
import { getProfile } from "@/lib/profile";
import { DebateMessage } from "./DebateMessage";

export function DebatePanel() {
  const [bookA, setBookA] = useState("The Secret History");
  const [bookB, setBookB] = useState("Normal People");
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [running, setRunning] = useState(false);

  async function start() {
    setRunning(true);
    setTurns([]);
    try {
      const profile = getProfile();
      const readerProfile = profile?.summary || "A curious reader looking for the strongest next match.";
      for await (const turn of streamDebate(bookA, bookB, readerProfile)) {
        if (turn.done) break;
        if (turn.error) throw new Error(turn.error);
        setTurns((prev) => [...prev, turn]);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Debate failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <input value={bookA} onChange={(e) => setBookA(e.target.value)} className="px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.12)] outline-none" />
        <input value={bookB} onChange={(e) => setBookB(e.target.value)} className="px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.12)] outline-none" />
      </div>
      <button disabled={running || !bookA || !bookB} onClick={start} className="px-3 py-2 bg-[#1a1410] text-[#f5f0e8] text-[11px] font-mono rounded-sm disabled:opacity-50">
        {running ? "Debating..." : "Start debate"}
      </button>
      <div className="flex flex-col gap-4 min-h-[320px]">
        {turns.map((turn, i) => <DebateMessage key={i} turn={turn} />)}
      </div>
    </div>
  );
}
