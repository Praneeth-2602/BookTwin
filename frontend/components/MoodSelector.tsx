"use client";

import { motion } from "framer-motion";

const MOODS = [
  "Contemplative & slow",
  "Fast-paced & gripping",
  "Funny & light",
  "Dark & unsettling",
  "Mind-expanding",
  "Emotional & moving",
];

interface Props {
  selected: string;
  onChange: (mood: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function MoodSelector({ selected, onChange }: Props) {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-3 gap-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {MOODS.map((mood) => {
        const isSelected = selected === mood;
        return (
          <motion.button
            key={mood}
            variants={item}
            onClick={() => onChange(isSelected ? "" : mood)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-3 py-3 text-[11px] leading-snug border rounded-lg text-left
              transition-colors duration-200 font-mono overflow-hidden
              ${isSelected
                ? "border-[#7F77DD] bg-[#EEEDFE] text-[#3C3489]"
                : "border-[rgba(26,20,16,0.15)] text-[rgba(26,20,16,0.55)] hover:border-[#7F77DD] hover:text-[rgba(26,20,16,0.8)] hover:bg-white/40"
              }
            `}
          >
            {/* Active dot indicator in top right */}
            {isSelected && (
              <motion.div
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#7F77DD]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              />
            )}
            
            <span className="relative z-10 pr-3">{mood}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
