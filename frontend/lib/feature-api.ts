import { PaceEstimate, SimilarityResult, DebateTurn, PlanSession } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function estimatePace(book_title: string, reading_speed: "slow" | "medium" | "fast") {
  return postJson<PaceEstimate>("/api/pace/estimate", { book_title, reading_speed });
}

export function fetchSimilarityMatrix(titles: string[]) {
  return postJson<SimilarityResult>("/api/similarity/matrix", { titles });
}

export async function* streamDebate(
  book_a: string,
  book_b: string,
  reader_profile: string
): AsyncGenerator<DebateTurn> {
  const res = await fetch(`${API_BASE}/api/debate/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_a, book_b, reader_profile }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Debate failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}

export function summarizeChapter(session_id: string, chapter_limit: number) {
  return postJson<{ summary: string; chapters_covered: number; word_count: number }>(
    "/api/chat/summarize",
    { session_id, chapter_limit }
  );
}

export function createReadingPlan(book_title: string, minutes_per_day: number, target_date: string, busy_days: string[]) {
  return postJson<{ plan_id: string; book_title: string; draft_plan: PlanSession[]; status: string; total_pages: number }>(
    "/api/plan/create",
    { book_title, minutes_per_day, target_date, busy_days }
  );
}

export function reviseReadingPlan(plan_id: string, feedback: string) {
  return postJson<{ final_plan: PlanSession[]; status: string; ics_content: string }>(
    "/api/plan/revise",
    { plan_id, feedback }
  );
}

export function approveReadingPlan(plan_id: string) {
  return postJson<{ final_plan: PlanSession[]; status: string; ics_content: string }>(
    "/api/plan/approve",
    { plan_id }
  );
}
