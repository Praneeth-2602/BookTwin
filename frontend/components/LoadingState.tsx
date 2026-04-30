"use client";

import { motion } from "framer-motion";

interface Props {
  pipelineStep: number;
}

const NODES = [
  "extract_preferences",
  "validate_input",
  "profile_reader",
  "match_inventory",
  "score_candidates",
  "explain_recommendation",
];

export function LoadingState({ pipelineStep }: Props) {
  // Safe bounds for current node
  const currentIndex = Math.max(0, Math.min(pipelineStep, NODES.length - 1));
  const currentNode = NODES[currentIndex] || "initializing";
  const progressPercent = ((currentIndex + 1) / NODES.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md h-[400px]">
      
      {/* Circular Progress Indicator */}
      <div className="relative flex items-center justify-center mb-12">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="rgba(26,20,16,0.05)"
            strokeWidth="4"
          />
          <motion.circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="#d4380d"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ strokeDasharray: "565.48", strokeDashoffset: "565.48" }}
            animate={{ strokeDashoffset: 565.48 - (565.48 * progressPercent) / 100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={currentNode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif italic text-2xl text-[#1a1410] text-center px-4"
          >
            {currentNode.replace("_", " ")}
          </motion.div>
        </div>
      </div>

      {/* Terminal log feed */}
      <div className="w-full flex flex-col gap-2 font-mono text-[11px] text-[rgba(26,20,16,0.6)]">
        {NODES.map((node, i) => {
          if (i > pipelineStep) return null; // Only show past/current
          
          const isDone = pipelineStep > i;
          const timeOffset = (0.7 * (i + 1)).toFixed(1);

          return (
            <motion.div
              key={node}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-[rgba(26,20,16,0.3)]">[{timeOffset}s]</span>
              {isDone ? (
                <>
                  <span className="text-[#0F6E56]">✓</span>
                  <span>{node} — done</span>
                </>
              ) : (
                <>
                  <span className="text-[#d4380d]">→</span>
                  <span className="text-[#1a1410]">{node} — running<motion.span animate={{opacity: [0,1,0]}} transition={{repeat: Infinity, duration: 1.5}}>...</motion.span></span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
