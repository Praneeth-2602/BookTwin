"use client";

import { useState } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { RightPanel } from "@/components/RightPanel";
import { fetchRecommendation } from "@/lib/api";
import { BookResponse } from "@/lib/types";
import { saveRecommendation } from "@/lib/history";
import { updateProfileAfterRecommendation } from "@/lib/profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Recommend");
  const [mood, setMood] = useState("");
  const [books, setBooks] = useState(["", "", "", "", ""]);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<BookResponse | null>(null);
  const [graphPrefillTitle, setGraphPrefillTitle] = useState<string | undefined>();

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

    const steps = [0, 1, 2, 3, 4, 5];
    for (const step of steps) {
      setPipelineStep(step);
      await new Promise((r) => setTimeout(r, 700));
    }

    try {
      const data = await fetchRecommendation({ mood, loved_books: lovedBooks, extra_context: extra });
      setPipelineStep(6);
      setResult(data);

      // Phase 3: auto-save to history
      saveRecommendation(data.recommendation, mood, lovedBooks);

      // Phase 4: update reader profile in background
      updateProfileAfterRecommendation(data.recommendation, mood);

    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Something went wrong.");
      setPipelineStep(-1);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenGraph(title: string) {
    setGraphPrefillTitle(title);
    setActiveTab("Graph");
  }

  function handleOpenChat() {
    setActiveTab("Chat");
  }

  function handleRerunFromHistory(m: string, b: string[]) {
    setMood(m);
    b.forEach((book, i) => updateBook(i, book));
    setActiveTab("Recommend");
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
        graphPrefillTitle={graphPrefillTitle}
        onRerunFromHistory={handleRerunFromHistory}
      />

      <div className="hidden lg:block lg:w-[38vw] shrink-0" />

      <RightPanel
        loading={loading}
        result={result}
        pipelineStep={pipelineStep}
        setMood={setMood}
        onOpenGraph={handleOpenGraph}
        onOpenChat={handleOpenChat}
      />
    </main>
  );
}
