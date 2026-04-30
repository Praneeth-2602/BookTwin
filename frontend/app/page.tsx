"use client";

import { useState } from "react";
import { MoodSelector } from "@/components/MoodSelector";
import { PipelineViz } from "@/components/PipelineViz";
import { ResultCard } from "@/components/ResultCard";
import { fetchRecommendation } from "@/lib/api";
import { BookResponse } from "@/lib/types";

export default function Home() {
  const [mood, setMood] = useState("");
  const [books, setBooks] = useState(["", "", "", "", ""]);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<BookResponse | null>(null);
  const [error, setError] = useState("");

  function updateBook(i: number, val: string) {
    setBooks((prev) => prev.map((b, idx) => (idx === i ? val : b)));
  }

  async function handleSubmit() {
    const lovedBooks = books.filter(Boolean);
    if (!mood && lovedBooks.length === 0) {
      setError("Please select a mood or enter at least one book.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    // Animate pipeline nodes while waiting
    const steps = [0, 1, 2, 3, 4, 5];
    for (const step of steps) {
      setPipelineStep(step);
      await new Promise((r) => setTimeout(r, 700));
    }

    try {
      const data = await fetchRecommendation({
        mood,
        loved_books: lovedBooks,
        extra_context: extra,
      });
      setPipelineStep(6);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPipelineStep(-1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-px bg-[#d4380d]" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#d4380d]">
            LangGraph + Groq
          </span>
        </div>
        <h1 className="font-serif text-5xl font-semibold leading-[0.92] text-[#1a1410] tracking-tight">
          Book<em className="not-italic text-[#d4380d]">Twin</em>
        </h1>
        <p className="mt-3 text-[12px] text-[rgba(26,20,16,0.5)] leading-relaxed max-w-sm">
          Describe your mood and the books you love. The LangGraph pipeline finds
          your single perfect next read.
        </p>
      </div>

      {/* Chain badge */}
      <div className="inline-flex items-center gap-1.5 text-[10px] border border-[rgba(26,20,16,0.12)] px-2.5 py-1 rounded mb-6 text-[rgba(26,20,16,0.5)] tracking-wide">
        <span className="w-2 h-2 rounded-full bg-[#7F77DD]" />
        LCEL pipeline · conditional edges · MemorySaver checkpointing
      </div>

      {/* Mood */}
      <Label>Your reading mood</Label>
      <div className="mb-5">
        <MoodSelector selected={mood} onChange={setMood} />
      </div>

      {/* Books */}
      <Label>Last 5 books you loved</Label>
      <div className="flex flex-col gap-2 mb-5">
        {books.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-[rgba(26,20,16,0.3)] w-4 shrink-0">
              {i + 1}.
            </span>
            <input
              value={b}
              onChange={(e) => updateBook(i, e.target.value)}
              placeholder={
                i === 0
                  ? "e.g. Piranesi by Susanna Clarke"
                  : i === 1
                    ? "e.g. The Secret History"
                    : ""
              }
              className="
                flex-1 px-3 py-2 text-[12px] font-mono
                border border-[rgba(26,20,16,0.12)] rounded-lg
                bg-white/50 text-[#1a1410]
                placeholder:text-[rgba(26,20,16,0.3)]
                outline-none focus:border-[#7F77DD]
                transition-colors
              "
            />
          </div>
        ))}
      </div>

      {/* Extra context */}
      <Label>Anything else?</Label>
      <textarea
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        rows={2}
        placeholder="e.g. No romance subplots. Under 400 pages. Set in a city..."
        className="
          w-full px-3 py-2.5 text-[12px] font-mono
          border border-[rgba(26,20,16,0.12)] rounded-lg
          bg-white/50 text-[#1a1410] resize-none
          placeholder:text-[rgba(26,20,16,0.3)]
          outline-none focus:border-[#7F77DD]
          transition-colors mb-5
        "
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="
          w-full py-3 border border-[#7F77DD] rounded-lg
          text-[12px] font-mono text-[#534AB7] tracking-wide
          hover:bg-[#EEEDFE] disabled:opacity-40 disabled:cursor-not-allowed
          transition-all
        "
      >
        {loading ? "Running graph..." : "Find my perfect book ↗"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 border border-[rgba(26,20,16,0.1)] rounded-lg text-[12px] text-[rgba(26,20,16,0.6)]">
          {error}
        </div>
      )}

      {/* Pipeline visualization */}
      {(loading || result) && <PipelineViz activeIndex={pipelineStep} />}

      {/* Result */}
      {result && <ResultCard data={result} />}
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.5)] mb-2">
      {children}
    </div>
  );
}
