"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraphData } from "@/lib/types";
import { fetchCharacterGraph } from "@/lib/chat-api";
import { CharacterGraph } from "./CharacterGraph";

interface Props {
  prefillTitle?: string;
}

export function GraphPanel({ prefillTitle }: Props) {
  const [bookTitle, setBookTitle] = useState(prefillTitle || "");
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!bookTitle.trim()) return;
    setLoading(true);
    setError("");
    setGraphData(null);
    try {
      const data = await fetchCharacterGraph(bookTitle.trim());
      setGraphData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate graph.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 h-full overflow-y-auto">
      <div>
        <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.5)] mb-3">
          Book title
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative group">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d4380d] opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. The Secret History"
              className="w-full px-3 py-2.5 text-[13px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.15)] text-[#1a1410] placeholder:text-[rgba(26,20,16,0.3)] outline-none focus:border-[#1a1410] transition-colors ml-2"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !bookTitle.trim()}
            className="px-5 py-2.5 bg-[#1a1410] text-[#f5f0e8] text-[12px] font-mono rounded-sm hover:bg-[#d4380d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? "Mapping…" : "Generate →"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[12px] font-mono text-[#d4380d] border border-[rgba(212,56,13,0.2)] rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3 py-8">
          {["Validating book…", "Extracting characters…", "Mapping relationships…", "Rendering graph…"].map(
            (step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6, duration: 0.4 }}
                className="flex items-center gap-2 text-[11px] font-mono text-[rgba(26,20,16,0.6)]"
              >
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.6 }}
                  className="w-1 h-1 rounded-full bg-[#d4380d] shrink-0"
                />
                {step}
              </motion.div>
            )
          )}
        </div>
      )}

      <AnimatePresence>
        {graphData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <CharacterGraph data={graphData} />
          </motion.div>
        )}
      </AnimatePresence>

      {!graphData && !loading && !error && (
        <div className="flex items-center justify-center py-16 border border-dashed border-[rgba(26,20,16,0.1)] rounded-lg text-[12px] font-mono text-[rgba(26,20,16,0.35)]">
          Enter a book title to generate its character map
        </div>
      )}
    </div>
  );
}
