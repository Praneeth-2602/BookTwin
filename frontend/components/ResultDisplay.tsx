"use client";

import { motion } from "framer-motion";
import { BookResponse } from "@/lib/types";
import { BookSpine } from "./BookSpine";

interface Props {
  data: BookResponse;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ResultDisplay({ data }: Props) {
  const { recommendation: r, pipeline_trace } = data;

  return (
    <div className="w-full group">
      {/* Top section (full-width hero) */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-10 relative"
      >
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#1a1410] leading-[1.1] mb-2 pr-24">
          {r.title}
        </h2>
        <div className="text-sm font-mono text-[rgba(26,20,16,0.5)] mb-4">
          by {r.author}{r.year ? ` · ${r.year}` : ""}
        </div>
        <div className="flex gap-2 flex-wrap">
          {r.genres.map((g) => (
            <span
              key={g}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[rgba(26,20,16,0.15)] text-[rgba(26,20,16,0.6)] tracking-wide uppercase"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Wax seal match score */}
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-[#1a1410] flex items-center justify-center shadow-lg transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
          <div className="w-[56px] h-[56px] rounded-full border border-dashed border-[#f5f0e8] opacity-60 flex flex-col items-center justify-center">
            <span className="text-[#f5f0e8] font-mono text-xs font-bold leading-none">{r.match_score.replace('%', '')}</span>
            <span className="text-[#f5f0e8] text-[8px] uppercase tracking-widest mt-0.5 opacity-80">Match</span>
          </div>
        </div>
      </motion.div>

      {/* Body: Two sub-columns (60/40) */}
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Left Sub-column (60%) */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col gap-8"
        >
          <Section label="Why you'll love it">
            <p className="font-serif text-[15px] leading-relaxed text-[#1a1410]">
              {r.why_you_will_love_it}
            </p>
          </Section>

          {r.mood_match && (
            <Section label="Mood match">
              <p className="font-serif text-[15px] leading-relaxed text-[#1a1410]">
                {r.mood_match}
              </p>
            </Section>
          )}

          {r.because_you_loved.length > 0 && (
            <Section label="Because you loved...">
              <ul className="flex flex-col gap-2">
                {r.because_you_loved.map((reason, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#d4380d] shrink-0" />
                    <span className="font-serif text-[14px] leading-relaxed text-[rgba(26,20,16,0.8)]">
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {r.caveat && (
            <div className="mt-4 pt-6 border-t border-[rgba(26,20,16,0.1)]">
              <div className="text-[10px] tracking-[0.15em] uppercase text-[rgba(26,20,16,0.4)] mb-2">
                Honest caveat
              </div>
              <p className="text-[12px] leading-relaxed text-[rgba(26,20,16,0.5)] italic">
                {r.caveat}
              </p>
            </div>
          )}
        </motion.div>

        {/* Right Sub-column (40%) */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full md:w-[240px] shrink-0 flex gap-6"
        >
          {/* Decorative Spine */}
          <BookSpine title={r.title} />

          {/* Actions & Log */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col gap-2 mb-8">
              <ActionButton label="View on Goodreads →" outline />
              <ActionButton label="Generate character graph →" />
              <ActionButton label="Chat with this book →" />
              <ActionButton label="Save to history" muted />
            </div>

            {/* Pipeline Trace (smaller) */}
            <div className="mt-auto">
              <div className="text-[9px] tracking-[0.15em] uppercase text-[rgba(26,20,16,0.3)] mb-3">
                Execution trace
              </div>
              <div className="flex flex-col gap-2">
                {pipeline_trace.map((t, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-[#0F6E56] text-[9px] mt-0.5">✓</span>
                    <div className="text-[10px] font-mono text-[rgba(26,20,16,0.5)] leading-snug">
                      {t.step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#d4380d] mb-3 font-mono">
        {label}
      </div>
      {children}
    </div>
  );
}

function ActionButton({ label, outline, muted }: { label: string; outline?: boolean; muted?: boolean }) {
  return (
    <button
      className={`
        w-full text-left px-3 py-2 text-[11px] font-mono rounded-sm transition-all duration-200
        ${outline 
          ? "border border-[#1a1410] text-[#1a1410] hover:bg-[#1a1410] hover:text-[#f5f0e8]" 
          : muted
            ? "text-[rgba(26,20,16,0.5)] hover:bg-[rgba(26,20,16,0.05)] hover:text-[#1a1410]"
            : "bg-[rgba(26,20,16,0.04)] text-[#1a1410] hover:bg-[rgba(26,20,16,0.08)]"
        }
      `}
    >
      {label}
    </button>
  );
}
