"use client";

import { useState } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { RightPanel } from "@/components/RightPanel";
import { fetchRecommendation } from "@/lib/api";
import { BookResponse } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Recommend");
  const [mood, setMood] = useState("");
  const [books, setBooks] = useState(["", "", "", "", ""]);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<BookResponse | null>(null);

  function updateBook(i: number, val: string) {
    setBooks((prev) => prev.map((b, idx) => (idx === i ? val : b)));
  }

  async function handleSubmit() {
    const lovedBooks = books.filter(Boolean);
    if (!mood && lovedBooks.length === 0) {
      alert("Please select a mood or enter at least one book.");
      return;
    }

    setResult(null);
    setLoading(true);

    // Simulate pipeline steps
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
      alert(e instanceof Error ? e.message : "Something went wrong.");
      setPipelineStep(-1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col lg:flex-row min-h-screen relative z-10 w-full overflow-hidden">
      <LeftPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mood={mood}
        setMood={setMood}
        books={books}
        updateBook={updateBook}
        extra={extra}
        setExtra={setExtra}
        loading={loading}
        handleSubmit={handleSubmit}
        pipelineStep={pipelineStep}
      />
      
      {/* Spacer for desktop since left panel is fixed */}
      <div className="hidden lg:block lg:w-[38vw] shrink-0" />
      
      <RightPanel
        loading={loading}
        result={result}
        pipelineStep={pipelineStep}
        setMood={setMood}
      />
    </main>
  );
}
