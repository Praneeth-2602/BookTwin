export interface BookRequest {
  mood: string;
  loved_books: string[];
  extra_context: string;
}

export interface PipelineTrace {
  step: string;
  output: string;
  status: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  year?: number;
  genres: string[];
  match_score: string;
  why_you_will_love_it: string;
  because_you_loved: string[];
  mood_match: string;
  caveat: string;
}

export interface BookResponse {
  recommendation: BookRecommendation;
  pipeline_trace: PipelineTrace[];
  graph_path: string;
}

// ── Phase 3: History ──────────────────────────
export interface SavedBook {
  id: string;
  savedAt: string;
  recommendation: BookRecommendation;
  inputMood: string;
  inputBooks: string[];
}

// ── Phase 4: Profile ──────────────────────────
export interface ReaderProfile {
  version: number;
  lastUpdated: string;
  summary: string;
  favoriteGenres: string[];
  recentMoods: string[];
  readCount: number;
}

// ── Phase 1: Character Graph ──────────────────
export interface GraphNode {
  id: string;
  label: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  personality: string;
  arc: string;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "ally" | "rival" | "romantic" | "family" | "mentor" | "colleague";
  strength: number;
  description: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  character_count: number;
  relationship_count: number;
  error?: string;
}

// ── Phase 2: Chat ────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

// ── Phase 5: Pace ───────────────────────────
export interface PaceSegment {
  label: string;
  days: number;
  pages: number;
  page_start: number;
  page_end: number;
}

export interface PaceEstimate {
  book_title: string;
  reading_speed: "slow" | "medium" | "fast";
  page_count: number;
  word_count: number;
  parts: number;
  wpm: number;
  total_days: number;
  daily_minutes: number;
  timeline: PaceSegment[];
}

// ── Phase 6: Similarity ─────────────────────
export interface SimilarityResult {
  titles: string[];
  descriptions: string[];
  matrix: number[][];
  explanations: string[][];
}

// ── Phase 7: Debate ─────────────────────────
export interface DebateTurn {
  role: "advocate_a" | "advocate_b" | "judge";
  content: string;
  round?: number;
  verdict?: string;
  done?: boolean;
  error?: string;
}

// ── Phase 9: Reading Plan ───────────────────
export interface PlanSession {
  date: string;
  pages_start: number;
  pages_end: number;
  session_minutes: number;
  note: string;
}
