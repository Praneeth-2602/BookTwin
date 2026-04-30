"use client";

import { motion } from "framer-motion";

const NODES = [
  "extract_preferences",
  "validate_input",
  "profile_reader",
  "match_inventory",
  "score_candidates",
  "explain_recommendation",
];

interface Props {
  activeIndex: number;
}

export function PipelineLog({ activeIndex }: Props) {
  if (activeIndex === -1) return null;

  return (
    <div className="mt-6 border-t border-[rgba(26,20,16,0.1)] pt-4">
      <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.4)] mb-4">
        Pipeline Execution
      </div>
      <div className="flex flex-col gap-2">
        {NODES.map((node, i) => {
          const isDone = activeIndex > i;
          const isActive = activeIndex === i;
          
          // Don't show pending nodes far in the future to keep it clean
          if (i > activeIndex + 1) return null;

          return (
            <motion.div
              key={node}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 font-mono text-[11px]"
            >
              {isDone ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#0F6E56]" />
                  <span className="text-[rgba(26,20,16,0.3)] line-through decoration-[rgba(26,20,16,0.2)]">
                    {node} — done
                  </span>
                </>
              ) : isActive ? (
                <>
                  <motion.span
                    className="w-2 h-2 rounded-full bg-[#d4380d]"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="text-[#1a1410] font-medium">
                    {node} <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >...</motion.span>
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full border border-[rgba(26,20,16,0.2)]" />
                  <span className="text-[rgba(26,20,16,0.3)]">
                    {node}
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
