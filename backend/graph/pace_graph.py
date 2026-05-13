"""
Phase 5 — Reading Pace Estimator

LangChain concept to study:
- @tool defines a structured function an LLM can call.
- llm.bind_tools([...]) gives the model access to that function.
- AIMessage.tool_calls is inspected, then ToolMessage carries the tool result back.
"""

import json
import math
import os
from typing import TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph


BOOK_DATA = {
    "normal people": {"pages": 273, "words": 80000, "parts": 3},
    "the name of the rose": {"pages": 502, "words": 190000, "parts": 7},
    "piranesi": {"pages": 245, "words": 70000, "parts": 7},
    "the secret history": {"pages": 559, "words": 193000, "parts": 8},
    "project hail mary": {"pages": 496, "words": 160000, "parts": 6},
    "sapiens": {"pages": 464, "words": 150000, "parts": 4},
    "educated": {"pages": 352, "words": 110000, "parts": 3},
    "dune": {"pages": 688, "words": 188000, "parts": 3},
    "the alchemist": {"pages": 208, "words": 45000, "parts": 2},
    "to kill a mockingbird": {"pages": 336, "words": 100000, "parts": 2},
    "1984": {"pages": 328, "words": 89000, "parts": 3},
    "pride and prejudice": {"pages": 432, "words": 122000, "parts": 3},
}

WPM = {"slow": 150, "medium": 250, "fast": 375}
DEFAULT_DAILY_MINUTES = 30


class PaceState(TypedDict):
    book_title: str
    reading_speed: str
    daily_minutes: int
    page_count: int
    word_count: int
    parts: int
    wpm: int
    timeline: list[dict]
    total_days: int
    trace: list[dict]


@tool
def estimate_pages(book_title: str, edition: str = "standard") -> dict:
    """Returns approximate page count, word count, and part count for a well-known book."""
    key = book_title.lower().strip()
    return BOOK_DATA.get(key, {"pages": 350, "words": 95000, "parts": 3})


def make_llm() -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, api_key=api_key)


def lookup_book_node(state: PaceState) -> dict:
    llm = make_llm().bind_tools([estimate_pages])
    messages = [
        SystemMessage(
            content=(
                "You estimate reading effort. Call estimate_pages exactly once for the user's book. "
                "Do not answer directly until the tool result is available."
            )
        ),
        HumanMessage(content=f"Book title: {state['book_title']}"),
    ]
    response = llm.invoke(messages)

    tool_result = estimate_pages.invoke({"book_title": state["book_title"], "edition": "standard"})
    if response.tool_calls:
        call = response.tool_calls[0]
        tool_result = estimate_pages.invoke(call["args"])
        messages.extend([
            response,
            ToolMessage(content=json.dumps(tool_result), tool_call_id=call["id"]),
        ])

    return {
        "page_count": int(tool_result["pages"]),
        "word_count": int(tool_result["words"]),
        "parts": max(1, int(tool_result["parts"])),
        "trace": [{"step": "lookup_book", "output": f"Tool returned {tool_result['pages']} pages."}],
    }


def calculate_pace_node(state: PaceState) -> dict:
    speed = state.get("reading_speed", "medium").lower()
    wpm = WPM.get(speed, WPM["medium"])
    minutes = max(15, int(state.get("daily_minutes") or DEFAULT_DAILY_MINUTES))
    total_minutes = state["word_count"] / wpm
    total_days = max(1, math.ceil(total_minutes / minutes))
    trace = state.get("trace", []) + [
        {"step": "calculate_pace", "output": f"{wpm} wpm at {minutes} minutes/day."}
    ]
    return {"wpm": wpm, "total_days": total_days, "trace": trace}


def format_timeline_node(state: PaceState) -> dict:
    parts = max(1, state["parts"])
    pages_per_part = state["page_count"] / parts
    words_per_part = state["word_count"] / parts
    minutes = max(15, int(state.get("daily_minutes") or DEFAULT_DAILY_MINUTES))

    timeline = []
    for i in range(parts):
        part_words = words_per_part
        days = max(1, math.ceil((part_words / state["wpm"]) / minutes))
        start_page = math.floor(i * pages_per_part) + 1
        end_page = math.floor((i + 1) * pages_per_part)
        timeline.append({
            "label": f"Part {i + 1}",
            "days": days,
            "pages": max(1, end_page - start_page + 1),
            "page_start": start_page,
            "page_end": end_page,
        })

    trace = state.get("trace", []) + [
        {"step": "format_timeline", "output": f"{len(timeline)} timeline segments created."}
    ]
    return {"timeline": timeline, "trace": trace}


def build_pace_graph():
    builder = StateGraph(PaceState)
    builder.add_node("lookup_book", lookup_book_node)
    builder.add_node("calculate_pace", calculate_pace_node)
    builder.add_node("format_timeline", format_timeline_node)
    builder.add_edge(START, "lookup_book")
    builder.add_edge("lookup_book", "calculate_pace")
    builder.add_edge("calculate_pace", "format_timeline")
    builder.add_edge("format_timeline", END)
    return builder.compile()


pace_graph = build_pace_graph()


async def run_pace_graph(book_title: str, reading_speed: str, daily_minutes: int = DEFAULT_DAILY_MINUTES) -> dict:
    initial_state: PaceState = {
        "book_title": book_title,
        "reading_speed": reading_speed,
        "daily_minutes": daily_minutes,
        "page_count": 0,
        "word_count": 0,
        "parts": 1,
        "wpm": WPM.get(reading_speed, WPM["medium"]),
        "timeline": [],
        "total_days": 0,
        "trace": [],
    }
    return await pace_graph.ainvoke(initial_state)
