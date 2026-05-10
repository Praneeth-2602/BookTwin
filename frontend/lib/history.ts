import { SavedBook, BookRecommendation } from "./types";

const HISTORY_KEY = "booktwin_history";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function saveRecommendation(
  rec: BookRecommendation,
  mood: string,
  books: string[]
): void {
  const history = getHistory();
  const entry: SavedBook = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    recommendation: rec,
    inputMood: mood,
    inputBooks: books.filter(Boolean),
  };
  // Prepend and keep max 50
  history.unshift(entry);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (_) {
    // localStorage full — ignore
  }
}

export function getHistory(): SavedBook[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteRecommendation(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function exportHistoryAsText(): string {
  const history = getHistory();
  if (history.length === 0) return "No reading history yet.";
  const lines = ["📚 BookTwin Reading History", "═".repeat(40), ""];
  history.forEach((entry, i) => {
    const date = new Date(entry.savedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    lines.push(
      `${i + 1}. ${entry.recommendation.title} — ${entry.recommendation.author}`,
      `   Saved: ${date}  ·  Match: ${entry.recommendation.match_score}`,
      `   Mood: ${entry.inputMood || "—"}`,
      ""
    );
  });
  return lines.join("\n");
}
