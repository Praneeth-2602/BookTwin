"use client";

export function ChapterSummary({ chapter, summary, wordCount }: { chapter: number; summary: string; wordCount: number }) {
  return (
    <div className="bg-[#fffaf2] border border-[rgba(212,56,13,0.18)] rounded-sm px-4 py-3">
      <div className="flex gap-2 mb-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#d4380d]">Chapter {chapter}</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[rgba(26,20,16,0.4)]">Spoiler-free</span>
      </div>
      <p className="font-serif text-[13px] leading-relaxed text-[#1a1410]">{summary}</p>
      <div className="mt-2 text-[10px] font-mono text-[rgba(26,20,16,0.35)]">{wordCount} words</div>
    </div>
  );
}
