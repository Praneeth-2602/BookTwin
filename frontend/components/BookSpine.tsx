"use client";

import { motion } from "framer-motion";

interface Props {
  title: string;
}

export function BookSpine({ title }: Props) {
  return (
    <motion.div
      className="h-full w-2 flex-shrink-0 flex items-center justify-center rounded-sm transition-colors duration-700 ease-in-out cursor-default overflow-hidden group-hover:bg-[#d4380d] bg-[#1a1410]"
    >
      <div className="vertical-rl font-serif italic text-[10px] tracking-widest text-[#f5f0e8] whitespace-nowrap opacity-60">
        {title}
      </div>
    </motion.div>
  );
}
