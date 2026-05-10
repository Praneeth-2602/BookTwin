"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SavedBook } from "@/lib/types";
import { getHistory, deleteRecommendation, exportHistoryAsText } from "@/lib/history";

interface Props {
  onRerun: (mood: string, books: string[]) => void;
}

export function HistoryPanel({ onRerun }: Props) {
  const [history, setHistory] = useState<SavedBook[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleDelete(id: string) {
    deleteRecommendation(id);
    setHistory(getHistory());
    if (expanded === id) setExpanded(null);
  }

  function handleExport() {
    const text = exportHistoryAsText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-[rgba(26,20,16,0.1)] rounded-lg">
        <div className="text-4xl opacity-20">📚</div>
        <div className="text-[12px] font-mono text-[rgba(26,20,16,0.4)] text-center">
          No recommendations saved yet.
          <br />
          Run your first recommendation to build your reading history.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.5)]">
          {history.length} saved {history.length === 1 ? "book" : "books"}
        </div>
        <button
          onClick={handleExport}
          className="text-[11px] font-mono text-[rgba(26,20,16,0.5)] hover:text-[#1a1410] transition-colors"
        >
          {copied ? "✓ Copied!" : "Export list →"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {history.map((entry) => {
            const r = entry.recommendation;
            const date = new Date(entry.savedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const isOpen = expanded === entry.id;

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.25 }}
                className="border border-[rgba(26,20,16,0.08)] rounded-lg overflow-hidden"
              >
                {/* Compact row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[rgba(26,20,16,0.02)] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-serif text-[#1a1410] truncate">{r.title}</div>
                    <div className="text-[11px] font-mono text-[rgba(26,20,16,0.5)] truncate">
                      {r.author} · {date}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[rgba(26,20,16,0.4)]">{r.match_score}</span>
                    <span className="text-[rgba(26,20,16,0.3)] text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded view */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-[rgba(26,20,16,0.06)] flex flex-col gap-4">
                        {/* Genre tags */}
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {r.genres.map((g) => (
                            <span
                              key={g}
                              className="text-[9px] px-2 py-0.5 rounded-full border border-[rgba(26,20,16,0.12)] text-[rgba(26,20,16,0.5)] tracking-wide uppercase"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <p className="text-[12px] font-serif text-[rgba(26,20,16,0.8)] leading-relaxed">
                          {r.why_you_will_love_it}
                        </p>

                        {/* Context */}
                        <div className="text-[10px] font-mono text-[rgba(26,20,16,0.4)]">
                          Mood: {entry.inputMood || "—"} · Books: {entry.inputBooks.join(", ") || "—"}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { onRerun(entry.inputMood, entry.inputBooks); }}
                            className="px-3 py-1.5 text-[11px] font-mono border border-[#1a1410] text-[#1a1410] hover:bg-[#1a1410] hover:text-[#f5f0e8] rounded-sm transition-colors"
                          >
                            Re-run with this taste →
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="px-3 py-1.5 text-[11px] font-mono text-[rgba(26,20,16,0.4)] hover:text-[#d4380d] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
