"""
BookTwin LangGraph Implementation
==================================

Graph structure:

    [START]
       │
       ▼
  extract_preferences          ← Node 1: parse mood + loved books into signals
       │
       ▼
  validate_input               ← Node 2: check if we have enough info
       │
   ╔═══╧════════════════╗
   ║ conditional edge   ║      ← Route: enough_info vs needs_clarification
   ╚═══╤════════════════╝
       │
  ┌────┴──────────────────────┐
  ▼                           ▼
build_reader_profile    request_clarification   ← conditional branches
  │                           │
  ▼                           ▼
match_books             [END with partial]
  │
  ▼
score_candidates             ← Node: score each candidate 1-100
  │
  ╔═══╧════════════════╗
  ║ conditional edge   ║      ← Route: high_confidence vs low_confidence
  ╚═══╤════════════════╝
      │
  ┌───┴───────────────────────┐
  ▼                           ▼
generate_explanation    broaden_search          ← second conditional branch
  │                           │
  │                           ▼
  │                     generate_explanation
  │                           │
  └───────────┬───────────────┘
              ▼
           [END]
"""

import json
import os
from dotenv import load_dotenv
from typing import TypedDict, Annotated, Optional
import operator

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver


# ─────────────────────────────────────────────
# STATE
# The entire graph shares this typed dict.
# Each node reads from it and writes back to it.
# ─────────────────────────────────────────────

class BookTwinState(TypedDict):
    # Inputs
    mood: str
    loved_books: list[str]
    extra_context: str

    # Extracted signals (filled by extract_preferences)
    themes: list[str]
    prose_style: str
    pacing: str
    emotional_register: str
    complexity: str
    avoid: list[str]

    # Validation result (filled by validate_input)
    has_enough_info: bool
    clarification_needed: str

    # Reader profile (filled by build_reader_profile)
    reader_profile: str

    # Candidates (filled by match_books)
    candidates: list[dict]        # list of {title, author, rationale}

    # Scoring (filled by score_candidates)
    top_candidate: dict
    confidence_score: int         # 0-100
    search_broadened: bool

    # Final output
    recommendation: Optional[dict]
    pipeline_trace: list[dict]
    graph_path: str               # records which conditional branches were taken


def make_llm() -> ChatGroq:
    # Load .env if present (development convenience)
    load_dotenv()

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Set the GROQ_API_KEY environment variable or create a .env file in the backend folder with GROQ_API_KEY=your_key"
        )

    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        api_key=api_key,
    )


def append_trace(state: BookTwinState, step: str, output: str) -> list[dict]:
    """Helper to accumulate trace entries."""
    existing = state.get("pipeline_trace", [])
    return existing + [{"step": step, "output": output, "status": "done"}]


# ─────────────────────────────────────────────
# NODE 1: extract_preferences
# Uses LCEL: prompt | llm | json parse
# ─────────────────────────────────────────────

def extract_preferences(state: BookTwinState) -> dict:
    llm = make_llm()

    system = """You extract reading preferences from user input.
Respond ONLY with a JSON object, no markdown fences:
{
  "themes": ["list", "of", "themes"],
  "prose_style": "e.g. lyrical, sparse, dense, conversational",
  "pacing": "e.g. slow-burn, fast, moderate",
  "emotional_register": "e.g. melancholic, tense, humorous, warm",
  "complexity": "e.g. literary, accessible, challenging",
  "avoid": ["things to avoid"]
}"""

    books_str = ", ".join(state["loved_books"]) if state["loved_books"] else "not specified"
    user_msg = f"""Mood: {state['mood'] or 'not specified'}
Loved books: {books_str}
Extra context: {state['extra_context'] or 'none'}"""

    # LCEL pattern: messages → llm → parse
    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)

    try:
        extracted = json.loads(response.content.strip())
    except json.JSONDecodeError:
        extracted = {
            "themes": [], "prose_style": "unknown",
            "pacing": "unknown", "emotional_register": "unknown",
            "complexity": "accessible", "avoid": []
        }

    trace = append_trace(state, "01 extract preferences",
                         f"Themes: {', '.join(extracted.get('themes', [])[:3])}. "
                         f"Style: {extracted.get('prose_style')}. "
                         f"Pacing: {extracted.get('pacing')}.")

    return {
        "themes": extracted.get("themes", []),
        "prose_style": extracted.get("prose_style", ""),
        "pacing": extracted.get("pacing", ""),
        "emotional_register": extracted.get("emotional_register", ""),
        "complexity": extracted.get("complexity", ""),
        "avoid": extracted.get("avoid", []),
        "pipeline_trace": trace,
    }


# ─────────────────────────────────────────────
# NODE 2: validate_input
# Decides if we have enough signal to proceed
# ─────────────────────────────────────────────

def validate_input(state: BookTwinState) -> dict:
    has_books = len(state.get("loved_books", [])) > 0
    has_mood = bool(state.get("mood", "").strip())
    has_themes = len(state.get("themes", [])) > 0

    has_enough = has_books or (has_mood and has_themes)

    clarification = ""
    if not has_enough:
        clarification = "Please share at least one book you loved, or describe your mood in more detail."

    trace = append_trace(state, "02 validate input",
                         "Sufficient signal detected." if has_enough
                         else "Insufficient input — routing to clarification.")

    return {
        "has_enough_info": has_enough,
        "clarification_needed": clarification,
        "pipeline_trace": trace,
    }


# ─────────────────────────────────────────────
# CONDITIONAL EDGE 1: route_after_validation
# This is the key LangGraph concept — a function
# that returns a string name of the next node.
# ─────────────────────────────────────────────

def route_after_validation(state: BookTwinState) -> str:
    """
    LangGraph conditional edge.
    Returns the name of the next node to execute.
    """
    if state["has_enough_info"]:
        return "build_reader_profile"
    else:
        return "request_clarification"


# ─────────────────────────────────────────────
# NODE 3a: request_clarification (terminal branch)
# ─────────────────────────────────────────────

def request_clarification(state: BookTwinState) -> dict:
    trace = append_trace(state, "03 clarification needed",
                         state.get("clarification_needed", "Need more input."))
    return {
        "pipeline_trace": trace,
        "graph_path": state.get("graph_path", "") + " → clarification_needed",
        "recommendation": None,
    }


# ─────────────────────────────────────────────
# NODE 3b: build_reader_profile
# ─────────────────────────────────────────────

def build_reader_profile(state: BookTwinState) -> dict:
    llm = make_llm()

    system = """You build a concise reader DNA profile. 2-3 sentences max.
Be specific — name concrete literary preferences, not vague adjectives."""

    books_str = ", ".join(state["loved_books"]) if state["loved_books"] else "not specified"
    user_msg = f"""Based on:
- Loved books: {books_str}
- Mood: {state['mood']}
- Themes they like: {', '.join(state['themes'])}
- Prose style: {state['prose_style']}
- Pacing: {state['pacing']}
- Emotional register: {state['emotional_register']}
- Complexity: {state['complexity']}
- Avoid: {', '.join(state['avoid']) if state['avoid'] else 'nothing specific'}

Write their reader profile."""

    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)
    profile = response.content.strip()

    trace = append_trace(state, "03 build reader profile", profile[:120] + "...")

    return {
        "reader_profile": profile,
        "pipeline_trace": trace,
        "graph_path": state.get("graph_path", "") + " → main_path",
    }


# ─────────────────────────────────────────────
# NODE 4: match_books
# Generate 3 candidates using reader profile
# ─────────────────────────────────────────────

def match_books(state: BookTwinState) -> dict:
    llm = make_llm()

    loved = state.get("loved_books", [])
    avoid_titles = ", ".join(loved) if loved else "none"

    system = f"""You are a literary expert. Generate exactly 3 book candidates.
Do NOT suggest: {avoid_titles}
Respond ONLY with JSON array, no markdown:
[
  {{"title": "...", "author": "...", "year": 1999, "genres": ["...", "..."], "rationale": "why this fits"}},
  ...
]"""

    user_msg = f"""Reader profile: {state.get('reader_profile', '')}
Mood: {state['mood']}
Extra: {state['extra_context']}"""

    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)

    try:
        raw = response.content.strip().replace("```json", "").replace("```", "")
        candidates = json.loads(raw)
    except json.JSONDecodeError:
        candidates = [{"title": "The Name of the Rose", "author": "Umberto Eco",
                       "year": 1980, "genres": ["Historical Fiction", "Mystery"],
                       "rationale": "Fallback candidate"}]

    trace = append_trace(state, "04 match candidates",
                         f"Found: {', '.join(c['title'] for c in candidates[:3])}")

    return {
        "candidates": candidates,
        "pipeline_trace": trace,
    }


# ─────────────────────────────────────────────
# NODE 5: score_candidates
# Score each candidate 0-100, pick the winner
# ─────────────────────────────────────────────

def score_candidates(state: BookTwinState) -> dict:
    llm = make_llm()

    candidates_str = json.dumps(state["candidates"], indent=2)

    system = """Score each book candidate 0-100 for fit with this reader.
Respond ONLY with JSON, no markdown:
{
  "scores": [{"title": "...", "score": 87, "reason": "one sentence"}],
  "winner_index": 0,
  "confidence": 85
}"""

    user_msg = f"""Reader profile: {state.get('reader_profile', '')}
Mood: {state['mood']}

Candidates:
{candidates_str}"""

    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)

    try:
        raw = response.content.strip().replace("```json", "").replace("```", "")
        scored = json.loads(raw)
        winner_idx = scored.get("winner_index", 0)
        confidence = scored.get("confidence", 70)
        top = state["candidates"][winner_idx]
    except (json.JSONDecodeError, IndexError):
        top = state["candidates"][0]
        confidence = 60

    trace = append_trace(state, "05 score candidates",
                         f"Winner: {top['title']} — confidence {confidence}/100")

    return {
        "top_candidate": top,
        "confidence_score": confidence,
        "pipeline_trace": trace,
    }


# ─────────────────────────────────────────────
# CONDITIONAL EDGE 2: route_after_scoring
# High confidence → explain directly
# Low confidence → broaden search first
# ─────────────────────────────────────────────

def route_after_scoring(state: BookTwinState) -> str:
    if state["confidence_score"] >= 70:
        return "generate_explanation"
    else:
        return "broaden_search"


# ─────────────────────────────────────────────
# NODE 6a: broaden_search
# Confidence was low → try again with wider lens
# ─────────────────────────────────────────────

def broaden_search(state: BookTwinState) -> dict:
    llm = make_llm()

    loved = state.get("loved_books", [])
    existing = [c["title"] for c in state.get("candidates", [])]
    avoid_all = ", ".join(loved + existing)

    system = f"""The previous candidates weren't a strong enough match. Generate 2 more diverse candidates.
Do NOT suggest: {avoid_all}
Try different genres, time periods, or styles.
Respond ONLY with JSON array:
[
  {{"title": "...", "author": "...", "year": 2001, "genres": ["..."], "rationale": "..."}},
  {{"title": "...", "author": "...", "year": 1985, "genres": ["..."], "rationale": "..."}}
]"""

    user_msg = f"Reader profile: {state.get('reader_profile', '')}\nMood: {state['mood']}"
    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)

    try:
        raw = response.content.strip().replace("```json", "").replace("```", "")
        new_candidates = json.loads(raw)
        # Pick the first new candidate as winner
        top = new_candidates[0] if new_candidates else state["top_candidate"]
    except (json.JSONDecodeError, IndexError):
        top = state["top_candidate"]

    trace = append_trace(state, "06 broaden search",
                         f"Low confidence — broadened. New top: {top.get('title', '?')}")

    return {
        "top_candidate": top,
        "search_broadened": True,
        "pipeline_trace": trace,
        "graph_path": state.get("graph_path", "") + " → broadened",
    }


# ─────────────────────────────────────────────
# NODE 6b / 7: generate_explanation
# Final node — produces the rich recommendation
# ─────────────────────────────────────────────

def generate_explanation(state: BookTwinState) -> dict:
    llm = make_llm()
    book = state["top_candidate"]
    loved = state.get("loved_books", [])
    score = state.get("confidence_score", 80)

    system = """Generate a rich, personal book recommendation explanation.
Respond ONLY with JSON, no markdown:
{
  "why_you_will_love_it": "2-3 specific sentences tied to this reader's profile",
  "because_you_loved": ["specific reason tied to one of their books", "another reason", "third reason"],
  "mood_match": "one sentence on how it fits their stated mood",
  "caveat": "one honest note — what kind of reader might NOT enjoy this"
}"""

    loved_str = ", ".join(loved) if loved else "not specified"
    user_msg = f"""Book: {book['title']} by {book['author']}
Reader profile: {state.get('reader_profile', '')}
Loved books: {loved_str}
Mood: {state['mood']}
Extra context: {state['extra_context']}"""

    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)

    try:
        raw = response.content.strip().replace("```json", "").replace("```", "")
        explanation = json.loads(raw)
    except json.JSONDecodeError:
        explanation = {
            "why_you_will_love_it": "This book matches your reading profile.",
            "because_you_loved": [],
            "mood_match": "Fits your current mood.",
            "caveat": "May not suit all readers."
        }

    broadened = state.get("search_broadened", False)
    path_suffix = " → explained (after broadening)" if broadened else " → explained (high confidence)"

    recommendation = {
        "title": book["title"],
        "author": book["author"],
        "year": book.get("year"),
        "genres": book.get("genres", []),
        "match_score": f"{min(score + 5, 99)}% match",
        "why_you_will_love_it": explanation.get("why_you_will_love_it", ""),
        "because_you_loved": explanation.get("because_you_loved", []),
        "mood_match": explanation.get("mood_match", ""),
        "caveat": explanation.get("caveat", ""),
    }

    trace = append_trace(state, "07 generate explanation",
                         f"Explanation generated for: {book['title']}")

    return {
        "recommendation": recommendation,
        "pipeline_trace": trace,
        "graph_path": state.get("graph_path", "") + path_suffix,
    }


# ─────────────────────────────────────────────
# BUILD THE GRAPH
# ─────────────────────────────────────────────

def build_graph():
    """
    Assembles and compiles the LangGraph StateGraph.

    Key LangGraph concepts used:
    - StateGraph: the graph itself, typed by BookTwinState
    - add_node: register each function as a node
    - add_edge: fixed transitions between nodes
    - add_conditional_edges: dynamic routing via a router function
    - compile: turns the graph into a runnable
    - MemorySaver: checkpointing for stateful multi-turn conversations
    """
    builder = StateGraph(BookTwinState)

    # Register all nodes
    builder.add_node("extract_preferences", extract_preferences)
    builder.add_node("validate_input", validate_input)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("build_reader_profile", build_reader_profile)
    builder.add_node("match_books", match_books)
    builder.add_node("score_candidates", score_candidates)
    builder.add_node("broaden_search", broaden_search)
    builder.add_node("generate_explanation", generate_explanation)

    # Fixed edges (always happen)
    builder.add_edge(START, "extract_preferences")
    builder.add_edge("extract_preferences", "validate_input")
    builder.add_edge("request_clarification", END)
    builder.add_edge("build_reader_profile", "match_books")
    builder.add_edge("match_books", "score_candidates")
    builder.add_edge("broaden_search", "generate_explanation")
    builder.add_edge("generate_explanation", END)

    # CONDITIONAL EDGE 1: after validation, route based on input quality
    builder.add_conditional_edges(
        "validate_input",                      # source node
        route_after_validation,                # router function → returns string
        {                                      # map of return value → node name
            "build_reader_profile": "build_reader_profile",
            "request_clarification": "request_clarification",
        }
    )

    # CONDITIONAL EDGE 2: after scoring, route based on confidence
    builder.add_conditional_edges(
        "score_candidates",
        route_after_scoring,
        {
            "generate_explanation": "generate_explanation",
            "broaden_search": "broaden_search",
        }
    )

    # MemorySaver enables graph checkpointing —
    # each run can be resumed from any node (useful for multi-turn)
    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


# Singleton graph instance
graph = build_graph()


async def run_book_graph(mood: str, loved_books: list[str], extra_context: str) -> dict:
    """
    Entry point for the FastAPI router.
    Invokes the compiled graph with initial state.
    """
    initial_state: BookTwinState = {
        "mood": mood,
        "loved_books": loved_books,
        "extra_context": extra_context,
        # All other fields will be filled by nodes
        "themes": [],
        "prose_style": "",
        "pacing": "",
        "emotional_register": "",
        "complexity": "",
        "avoid": [],
        "has_enough_info": False,
        "clarification_needed": "",
        "reader_profile": "",
        "candidates": [],
        "top_candidate": {},
        "confidence_score": 0,
        "search_broadened": False,
        "recommendation": None,
        "pipeline_trace": [],
        "graph_path": "",
    }

    # thread_id enables checkpointing per session
    config = {"configurable": {"thread_id": "booktwin-session-1"}}

    final_state = await graph.ainvoke(initial_state, config=config)
    return final_state
