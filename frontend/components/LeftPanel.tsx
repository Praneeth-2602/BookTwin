"use client";

import { motion } from "framer-motion";
import { MoodSelector } from "./MoodSelector";
import { PipelineLog } from "./PipelineLog";
import { GraphPanel } from "./GraphPanel";
import { ChatPanel } from "./ChatPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ProfileSidebar } from "./ProfileSidebar";
import { ComparePanel } from "./ComparePanel";
import { DebatePanel } from "./DebatePanel";
import { PlanPanel } from "./PlanPanel";

interface LeftPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mood: string;
  setMood: (mood: string) => void;
  books: string[];
  updateBook: (index: number, val: string) => void;
  extra: string;
  setExtra: (extra: string) => void;
  loading: boolean;
  handleSubmit: () => void;
  pipelineStep: number;
  graphPrefillTitle?: string;
  onRerunFromHistory: (mood: string, books: string[]) => void;
}

const TABS = ["Recommend", "Graph", "Chat", "Compare", "Debate", "Plan", "History"];

export function LeftPanel({
  activeTab,
  setActiveTab,
  mood,
  setMood,
  books,
  updateBook,
  extra,
  setExtra,
  loading,
  handleSubmit,
  pipelineStep,
  graphPrefillTitle,
  onRerunFromHistory,
}: LeftPanelProps) {
  return (
    <div className="w-full lg:w-[38vw] lg:min-h-screen lg:h-screen bg-[#ede8de] border-r border-[rgba(26,20,16,0.1)] lg:fixed lg:top-0 lg:left-0 flex flex-col z-20 overflow-y-auto">
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-2 spine-pattern opacity-10" />

      <div className="flex-1 flex flex-col px-8 py-10 lg:pl-16 lg:pr-12 h-full overflow-y-auto">
        {/* Identity Block */}
        <div className="mb-10 pt-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-[#d4380d]" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#d4380d]">
              LangGraph · Groq
            </span>
          </div>
          <h1 className="font-serif text-[52px] font-semibold leading-[0.9] text-[#1a1410] tracking-tight">
            Book<em className="not-italic text-[#d4380d]">Twin</em>
          </h1>
          <p className="mt-3 text-[12px] text-[rgba(26,20,16,0.5)] font-mono">
            Describe your mood. Get one perfect book.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-1.5 rounded-full text-[12px] font-mono whitespace-nowrap
                transition-all duration-200
                ${activeTab === tab
                  ? "bg-[#d4380d] text-[#f5f0e8]"
                  : "text-[rgba(26,20,16,0.5)] hover:text-[#1a1410] hover:bg-[rgba(26,20,16,0.05)]"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab: Recommend ── */}
        {activeTab === "Recommend" && (
          <div className="flex-1 flex flex-col">
            <Label>Your reading mood</Label>
            <div className="mb-8">
              <MoodSelector selected={mood} onChange={setMood} />
            </div>

            <Label>Last 5 books you loved</Label>
            <div className="flex flex-col gap-2 mb-8">
              {books.map((b, i) => (
                <div key={i} className="flex items-center gap-2 group relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d4380d] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <span className="text-[11px] text-[rgba(26,20,16,0.3)] w-4 shrink-0 font-mono ml-2">
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
                    className="flex-1 px-3 py-2 text-[12px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.1)] text-[#1a1410] placeholder:text-[rgba(26,20,16,0.3)] outline-none focus:border-[#1a1410] transition-colors"
                  />
                </div>
              ))}
            </div>

            <Label>Anything else?</Label>
            <div className="relative group mb-8">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d4380d] opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={2}
                placeholder="e.g. No romance subplots. Under 400 pages. Set in a city..."
                className="w-full px-3 py-2.5 text-[12px] font-mono ml-2 bg-transparent border-b border-[rgba(26,20,16,0.1)] text-[#1a1410] resize-none placeholder:text-[rgba(26,20,16,0.3)] outline-none focus:border-[#1a1410] transition-colors"
              />
            </div>

            <div className="flex-1" />

            {(loading || pipelineStep >= 0) && (
              <div className="mb-6">
                <PipelineLog activeIndex={pipelineStep} />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="wax-seal-btn w-full h-[56px] rounded-sm font-serif italic text-[18px] tracking-wide relative overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <motion.span
                  className="flex items-center justify-center gap-2"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  Running graph...
                </motion.span>
              ) : (
                "Find my twin →"
              )}
            </button>

            <ProfileSidebar />
          </div>
        )}

        {/* ── Tab: Graph ── */}
        {activeTab === "Graph" && (
          <div className="flex-1">
            <GraphPanel prefillTitle={graphPrefillTitle} />
          </div>
        )}

        {/* ── Tab: Chat ── */}
        {activeTab === "Chat" && (
          <div className="flex-1">
            <ChatPanel />
          </div>
        )}

        {/* ── Tab: Compare ── */}
        {activeTab === "Compare" && (
          <div className="flex-1">
            <ComparePanel />
          </div>
        )}

        {/* ── Tab: Debate ── */}
        {activeTab === "Debate" && (
          <div className="flex-1">
            <DebatePanel />
          </div>
        )}

        {/* ── Tab: Plan ── */}
        {activeTab === "Plan" && (
          <div className="flex-1">
            <PlanPanel />
          </div>
        )}

        {/* ── Tab: History ── */}
        {activeTab === "History" && (
          <div className="flex-1">
            <HistoryPanel
              onRerun={(m, b) => {
                setMood(m);
                b.forEach((book, i) => updateBook(i, book));
                setActiveTab("Recommend");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(26,20,16,0.5)] mb-3">
      {children}
    </div>
  );
}
