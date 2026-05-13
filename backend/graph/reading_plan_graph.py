"""
Phase 9 — Weekly Reading Plan

LangGraph concept to study:
- interrupt_before pauses before await_feedback.
- MemorySaver stores the draft by thread_id.
- A second request resumes the graph with human_feedback.
"""

import json
import math
import os
import uuid
from datetime import date, datetime, timedelta
from typing import TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from graph.pace_graph import BOOK_DATA


class PlanState(TypedDict):
    plan_id: str
    book_title: str
    total_pages: int
    minutes_per_day: int
    target_date: str
    busy_days: list[str]
    draft_plan: list[dict]
    human_feedback: str
    final_plan: list[dict]
    approved: bool


def make_llm() -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2, api_key=api_key)


def lookup_pages(book_title: str) -> int:
    return int(BOOK_DATA.get(book_title.lower().strip(), {"pages": 350})["pages"])


def generate_even_plan(book_title: str, total_pages: int, minutes_per_day: int, target_date: str, busy_days: list[str]) -> list[dict]:
    start = date.today()
    end = datetime.fromisoformat(target_date).date()
    if end <= start:
        end = start + timedelta(days=7)

    busy = {d.lower() for d in busy_days}
    days = []
    cur = start
    while cur <= end:
        if cur.strftime("%A").lower() not in busy:
            days.append(cur)
        cur += timedelta(days=1)
    if not days:
        days = [start]

    pages_per_session = max(1, math.ceil(total_pages / len(days)))
    plan = []
    page = 1
    for d in days:
        if page > total_pages:
            break
        end_page = min(total_pages, page + pages_per_session - 1)
        plan.append({
            "date": d.isoformat(),
            "pages_start": page,
            "pages_end": end_page,
            "session_minutes": minutes_per_day,
            "note": f"Read {book_title} steadily; stop at page {end_page}.",
        })
        page = end_page + 1
    return plan


def generate_draft_node(state: PlanState) -> dict:
    total_pages = state.get("total_pages") or lookup_pages(state["book_title"])
    draft = generate_even_plan(
        state["book_title"],
        total_pages,
        state["minutes_per_day"],
        state["target_date"],
        state.get("busy_days", []),
    )
    return {"total_pages": total_pages, "draft_plan": draft}


def await_feedback_node(state: PlanState) -> dict:
    return {}


def revise_plan_node(state: PlanState) -> dict:
    feedback = state.get("human_feedback", "").strip()
    if not feedback or feedback.lower() in {"approve", "approved", "looks good"}:
        return {"final_plan": state["draft_plan"], "approved": True}

    llm = make_llm()
    system = """Revise a reading plan according to user feedback.
Return ONLY valid JSON array with objects:
[{"date":"YYYY-MM-DD","pages_start":1,"pages_end":35,"session_minutes":30,"note":"..."}]
Keep total page coverage continuous and do not invent pages outside the existing range."""
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=f"Current plan: {json.dumps(state['draft_plan'])}\n\nFeedback: {feedback}"),
    ])
    try:
        raw = response.content.strip().replace("```json", "").replace("```", "")
        revised = json.loads(raw)
    except Exception:
        revised = state["draft_plan"]
    return {"draft_plan": revised, "final_plan": revised, "approved": True}


def finalize_node(state: PlanState) -> dict:
    final = state.get("final_plan") or state.get("draft_plan", [])
    return {"final_plan": final, "approved": True}


def build_plan_graph():
    builder = StateGraph(PlanState)
    builder.add_node("generate_draft", generate_draft_node)
    builder.add_node("await_feedback", await_feedback_node)
    builder.add_node("revise_plan", revise_plan_node)
    builder.add_node("finalize", finalize_node)
    builder.add_edge(START, "generate_draft")
    builder.add_edge("generate_draft", "await_feedback")
    builder.add_edge("await_feedback", "revise_plan")
    builder.add_edge("revise_plan", "finalize")
    builder.add_edge("finalize", END)
    return builder.compile(checkpointer=MemorySaver(), interrupt_before=["await_feedback"])


plan_graph = build_plan_graph()


async def create_plan(book_title: str, minutes_per_day: int, target_date: str, busy_days: list[str] | None = None) -> dict:
    plan_id = str(uuid.uuid4())
    initial_state: PlanState = {
        "plan_id": plan_id,
        "book_title": book_title,
        "total_pages": lookup_pages(book_title),
        "minutes_per_day": minutes_per_day,
        "target_date": target_date,
        "busy_days": busy_days or [],
        "draft_plan": [],
        "human_feedback": "",
        "final_plan": [],
        "approved": False,
    }
    config = {"configurable": {"thread_id": plan_id}}
    await plan_graph.ainvoke(initial_state, config=config)
    snapshot = plan_graph.get_state(config)
    values = snapshot.values
    return {"plan_id": plan_id, **values}


async def revise_plan(plan_id: str, feedback: str) -> dict:
    config = {"configurable": {"thread_id": plan_id}}
    await plan_graph.ainvoke({"human_feedback": feedback}, config=config)
    snapshot = plan_graph.get_state(config)
    return {"plan_id": plan_id, **snapshot.values}


def get_plan_state(plan_id: str) -> dict:
    config = {"configurable": {"thread_id": plan_id}}
    return {"plan_id": plan_id, **plan_graph.get_state(config).values}
