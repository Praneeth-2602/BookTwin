"""
Phase 7 — Debate Two Books

LangGraph concept to study:
- Multiple agent nodes share one state object.
- Each node reads the accumulated messages and appends its own turn.
- Conditional routing alternates speakers until the judge node runs.
"""

import os
from typing import TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph


class DebateState(TypedDict):
    book_a: str
    book_b: str
    reader_profile: str
    messages: list[dict]
    round: int
    verdict: str
    winner: str


def make_llm(temperature: float = 0.7) -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature, api_key=api_key)


def format_history(messages: list[dict]) -> str:
    if not messages:
        return "No debate turns yet."
    return "\n".join(f"{m['role']}: {m['content']}" for m in messages)


def advocate_node(state: DebateState, role: str, book_key: str, opponent_key: str) -> dict:
    llm = make_llm()
    book = state[book_key]
    opponent = state[opponent_key]
    system = f"""You are {role}, advocating for "{book}" over "{opponent}".
Use the reader profile. Respond to the previous argument if one exists.
Keep it specific, persuasive, and 2-3 sentences."""
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=f"Reader profile: {state['reader_profile']}\n\nDebate so far:\n{format_history(state['messages'])}"),
    ])
    new_message = {"role": role, "content": response.content.strip(), "round": (state["round"] // 2) + 1}
    return {"messages": state["messages"] + [new_message], "round": state["round"] + 1}


def advocate_a_node(state: DebateState) -> dict:
    return advocate_node(state, "advocate_a", "book_a", "book_b")


def advocate_b_node(state: DebateState) -> dict:
    return advocate_node(state, "advocate_b", "book_b", "book_a")


def judge_node(state: DebateState) -> dict:
    llm = make_llm(temperature=0.2)
    system = """You are the judge in a two-book debate.
Choose one winner for what the reader should read first. Be fair, concrete, and concise.
Start with either WINNER: book_a or WINNER: book_b, then give 3-4 sentences of reasoning."""
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(
            content=(
                f"book_a: {state['book_a']}\nbook_b: {state['book_b']}\n"
                f"Reader profile: {state['reader_profile']}\n\nDebate:\n{format_history(state['messages'])}"
            )
        ),
    ])
    content = response.content.strip()
    winner = "book_b" if "winner: book_b" in content.lower() else "book_a"
    message = {"role": "judge", "content": content, "round": 4}
    return {
        "messages": state["messages"] + [message],
        "verdict": content,
        "winner": winner,
    }


def route_debate(state: DebateState) -> str:
    if state["round"] >= 6:
        return "judge"
    return "advocate_a" if state["round"] % 2 == 0 else "advocate_b"


def build_debate_graph():
    builder = StateGraph(DebateState)
    builder.add_node("advocate_a", advocate_a_node)
    builder.add_node("advocate_b", advocate_b_node)
    builder.add_node("judge", judge_node)
    builder.add_conditional_edges(START, route_debate, {"advocate_a": "advocate_a", "advocate_b": "advocate_b", "judge": "judge"})
    builder.add_conditional_edges("advocate_a", route_debate, {"advocate_a": "advocate_a", "advocate_b": "advocate_b", "judge": "judge"})
    builder.add_conditional_edges("advocate_b", route_debate, {"advocate_a": "advocate_a", "advocate_b": "advocate_b", "judge": "judge"})
    builder.add_edge("judge", END)
    return builder.compile()


debate_graph = build_debate_graph()


async def run_debate_graph(book_a: str, book_b: str, reader_profile: str) -> dict:
    initial_state: DebateState = {
        "book_a": book_a,
        "book_b": book_b,
        "reader_profile": reader_profile,
        "messages": [],
        "round": 0,
        "verdict": "",
        "winner": "",
    }
    return await debate_graph.ainvoke(initial_state)
