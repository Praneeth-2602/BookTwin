"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookResponse } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ResultDisplay } from "./ResultDisplay";

interface RightPanelProps {
  loading: boolean;
  result: BookResponse | null;
  pipelineStep: number;
  setMood: (mood: string) => void; // For ghost buttons in empty state
}

export function RightPanel({ loading, result, pipelineStep, setMood }: RightPanelProps) {
  // Determine current state
  let state: "empty" | "loading" | "result" = "empty";
  if (loading) state = "loading";
  else if (result) state = "result";

  return (
    <div className="flex-1 min-h-screen bg-[#f5f0e8] relative overflow-y-auto">
      {/* 48px padding and max-w-3xl centering as requested */}
      <div className="p-12 max-w-3xl mx-auto min-h-full flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {state === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex justify-center"
            >
              <EmptyState onSelectMood={setMood} />
            </motion.div>
          )}

          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex justify-center"
            >
              <LoadingState pipelineStep={pipelineStep} />
            </motion.div>
          )}

          {state === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full"
            >
              <ResultDisplay data={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
