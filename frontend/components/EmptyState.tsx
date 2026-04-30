"use client";

import { motion } from "framer-motion";

interface Props {
  onSelectMood: (mood: string) => void;
}

const SUGGESTIONS = [
  "I want something devastating and beautiful, like I've been wracked with grief",
  "Fast, funny, I need to forget my week exists",
  "Mind-expanding non-fiction, the universe-is-strange kind",
];

export function EmptyState({ onSelectMood }: Props) {
  return (
    <div className="flex flex-col items-center max-w-md w-full mt-12">
      {/* Stylized Open Book Illustration */}
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        {/* Radiating lines */}
        <motion.div
          className="absolute inset-0 opacity-[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-0 bottom-0 w-px bg-[#1a1410]"
              style={{ transform: `rotate(${i * 15}deg)` }}
            />
          ))}
        </motion.div>
        
        {/* Book SVG */}
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 opacity-80">
          <path d="M60 70C60 70 40 50 10 50V10C40 10 60 30 60 30C60 30 80 10 110 10V50C80 50 60 70 60 70Z" stroke="#1a1410" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M60 30V70" stroke="#1a1410" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M25 25C40 25 50 35 50 35" stroke="#1a1410" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M25 35C40 35 50 45 50 45" stroke="#1a1410" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M95 25C80 25 70 35 70 35" stroke="#1a1410" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M95 35C80 35 70 45 70 45" stroke="#1a1410" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {SUGGESTIONS.map((suggestion, i) => (
          <motion.button
            key={i}
            onClick={() => onSelectMood(suggestion)}
            className="px-4 py-3 border border-[rgba(26,20,16,0.1)] rounded-md text-[12px] font-mono text-[rgba(26,20,16,0.6)] text-left hover:bg-[rgba(26,20,16,0.03)] hover:text-[#1a1410] transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5 }}
          >
            "{suggestion}"
          </motion.button>
        ))}
      </div>
      
      <div className="mt-8 text-[11px] font-mono text-[rgba(26,20,16,0.4)]">
        Your recommendation will appear here
      </div>
    </div>
  );
}
