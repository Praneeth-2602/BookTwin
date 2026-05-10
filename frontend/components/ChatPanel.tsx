"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/lib/types";
import { uploadBookPDF, streamChatMessage } from "@/lib/chat-api";
import { summarizeChapter } from "@/lib/feature-api";
import { ChapterSummary } from "./ChapterSummary";

export function ChatPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [titleGuess, setTitleGuess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [summary, setSummary] = useState<{ chapter: number; text: string; wordCount: number } | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    try {
      const { session_id, title_guess } = await uploadBookPDF(file);
      setSessionId(session_id);
      setTitleGuess(title_guess);
      setMessages([{
        role: "assistant",
        content: `Ready to discuss "${title_guess}". Ask me anything — themes, characters, what the ending means, how chapters connect…`,
      }]);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  async function handleSend() {
    if (!input.trim() || !sessionId || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let fullContent = "";
    let sources: string[] = [];

    try {
      for await (const chunk of streamChatMessage(sessionId, userMsg)) {
        if (chunk.error) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: `Error: ${chunk.error}` };
            return copy;
          });
          break;
        }
        if (chunk.token) {
          fullContent += chunk.token;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: fullContent };
            return copy;
          });
        }
        if (chunk.done) {
          sources = chunk.sources || [];
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: fullContent, sources };
            return copy;
          });
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  async function handleSummary(chapter: number) {
    if (!sessionId || summarizing) return;
    setSummarizing(true);
    try {
      const result = await summarizeChapter(sessionId, chapter);
      setSummary({ chapter, text: result.summary, wordCount: result.word_count });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Summary failed.");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      {!sessionId ? (
        /* Upload area */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-[#d4380d] bg-[rgba(212,56,13,0.04)]"
              : "border-[rgba(26,20,16,0.15)] hover:border-[rgba(26,20,16,0.3)]"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[13px] font-mono text-[rgba(26,20,16,0.6)]"
            >
              Processing PDF…
            </motion.div>
          ) : (
            <>
              <div className="text-4xl opacity-30">📄</div>
              <div className="text-[13px] font-mono text-[rgba(26,20,16,0.5)] text-center">
                Drop your book PDF here
                <br />
                <span className="text-[11px] text-[rgba(26,20,16,0.35)]">or click to browse · max 10MB</span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Chat UI */
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-[rgba(26,20,16,0.5)]">
              Chatting with: <span className="text-[#1a1410]">{titleGuess}</span>
            </div>
            <button
              onClick={() => { setSessionId(null); setMessages([]); setTitleGuess(""); }}
              className="text-[10px] font-mono text-[rgba(26,20,16,0.4)] hover:text-[#d4380d] transition-colors"
            >
              Upload new →
            </button>
          </div>

          <div className="flex flex-col gap-2 pb-2 border-b border-[rgba(26,20,16,0.08)]">
            <div className="text-[10px] font-mono text-[rgba(26,20,16,0.45)]">Summarize up to chapter</div>
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 5, 10, 20].map((chapter) => (
                <button
                  key={chapter}
                  onClick={() => handleSummary(chapter)}
                  disabled={summarizing}
                  className="px-2.5 py-1 bg-white rounded-sm text-[10px] font-mono text-[#1a1410] disabled:opacity-40"
                >
                  {chapter}
                </button>
              ))}
            </div>
            {summarizing && <div className="text-[11px] font-mono text-[rgba(26,20,16,0.45)]">Summarizing...</div>}
            {summary && <ChapterSummary chapter={summary.chapter} summary={summary.text} wordCount={summary.wordCount} />}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1a1410] text-[#f5f0e8] font-mono"
                        : "bg-white border border-[rgba(26,20,16,0.08)] text-[#1a1410] font-serif"
                    }`}
                  >
                    {msg.content || (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-[rgba(26,20,16,0.4)] rounded-sm"
                      />
                    )}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="text-[10px] font-mono text-[rgba(26,20,16,0.4)] px-1">
                      {msg.sources.join(" · ")}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-2 border-t border-[rgba(26,20,16,0.08)]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask anything about the book…"
              disabled={streaming}
              className="flex-1 px-3 py-2.5 text-[13px] font-mono bg-transparent border-b border-[rgba(26,20,16,0.15)] text-[#1a1410] placeholder:text-[rgba(26,20,16,0.3)] outline-none focus:border-[#1a1410] transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              className="px-5 py-2.5 bg-[#1a1410] text-[#f5f0e8] text-[12px] font-mono rounded-sm hover:bg-[#d4380d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
