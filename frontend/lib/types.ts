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
