"use client";

import { BookResponse } from "@/lib/types";

interface Props {
  data: BookResponse;
}

export function ResultCard({ data }: Props) {
  const { recommendation: r, pipeline_trace, graph_path } = data;

  return (
    <div className="animate-[fadeUp_0.4s_ease_both]">
      {/* Divider */}
      <div className="h-px bg-[rgba(26,20,16,0.12)] my-6" />

      {/* Main recommendation card */}
      <div className="border border-[rgba(26,20,16,0.15)] rounded-xl overflow-hidden bg-white/60">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(26,20,16,0.08)] flex justify-between items-start gap-4">
          <div>
            <div className="font-serif italic text-2xl font-semibold text-[#1a1410] mb-1">
              {r.title}
            </div>
            <div className="text-xs text-[rgba(26,20,16,0.55)]">
              by {r.author}{r.year ? ` · ${r.year}` : ""}
            </div>
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              {r.genres.map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-2 py-0.5 border border-[rgba(26,20,16,0.15)] rounded text-[rgba(26,20,16,0.55)] tracking-wide"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-[11px] px-2.5 py-1 rounded border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489] tracking-wide whitespace-nowrap">
            {r.match_score}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          <Section label="Why you will love it">
            <p className="text-[13px] leading-[1.75] text-[rgba(26,20,16,0.7)]">
              {r.why_you_will_love_it}
            </p>
          </Section>

          {r.mood_match && (
            <Section label="Mood match">
              <p className="text-[13px] leading-[1.75] text-[rgba(26,20,16,0.7)]">
                {r.mood_match}
              </p>
            </Section>
          )}

          {r.because_you_loved.length > 0 && (
            <Section label="Because you loved your picks">
              <div className="flex flex-col gap-1.5">
                {r.because_you_loved.map((reason, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#7F77DD] shrink-0" />
                    <span className="text-[12px] leading-[1.6] text-[rgba(26,20,16,0.65)]">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {r.caveat && (
            <Section label="Honest caveat">
              <p className="text-[12px] leading-[1.75] text-[rgba(26,20,16,0.45)]">
                {r.caveat}
              </p>
            </Section>
          )}
        </div>
      </div>

      {/* Pipeline trace */}
      <div className="mt-4 border border-[rgba(26,20,16,0.1)] rounded-lg p-4 bg-[rgba(26,20,16,0.02)]">
        <div className="text-[10px] tracking-[0.15em] uppercase text-[rgba(26,20,16,0.4)] mb-3">
          LangGraph execution trace
        </div>
        <div className="flex flex-col gap-2">
          {pipeline_trace.map((t, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <CheckIcon />
              <div>
                <div className="text-[11px] font-medium text-[rgba(26,20,16,0.8)]">
                  {t.step}
                </div>
                <div className="text-[10px] text-[rgba(26,20,16,0.45)] leading-relaxed">
                  {t.output}
                </div>
              </div>
            </div>
          ))}
        </div>
        {graph_path && (
          <div className="mt-3 pt-3 border-t border-[rgba(26,20,16,0.08)]">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[rgba(26,20,16,0.35)] mb-1">
              Graph path taken
            </div>
            <div className="text-[11px] text-[#534AB7] font-mono">{graph_path}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.15em] uppercase text-[rgba(26,20,16,0.35)] mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-[18px] h-[18px] rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0 mt-0.5">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 5l2 2 4-4"
          stroke="#085041"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
