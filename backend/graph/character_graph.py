"""
BookTwin — Character & Relationship Graph
==========================================

LangGraph multi-node graph that:
1. validate_book  — quick yes/no: is this a real book?
2. extract_characters — structured Pydantic output of all major/supporting chars
3. extract_relationships — structured Pydantic output of pairwise relationships
4. format_graph — converts to D3-compatible JSON

Conditional edge: if book not found → END with error
"""

import json
import os
from typing import TypedDict
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END, START


# ─────────────────────────────────────────────
# GRAPH STATE
# ─────────────────────────────────────────────

class CharacterGraphState(TypedDict):
    book_title: str
    book_found: bool
    error_message: str
    raw_character_data: str
    characters: list           # list of character dicts
    relationships: list        # list of relation dicts
    graph_data: dict           # D3-compatible { nodes, links }


ROLE_SIZE = {
    "protagonist": 28,
    "antagonist": 24,
    "supporting": 18,
    "minor": 12,
}


def make_llm() -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3, api_key=api_key)


# ─────────────────────────────────────────────
# NODE 1: validate_book
# ─────────────────────────────────────────────

def validate_book_node(state: CharacterGraphState) -> dict:
    llm = make_llm()
    response = llm.invoke([
        SystemMessage(content="You answer ONLY yes or no. No punctuation, no explanation."),
        HumanMessage(content=f"Is '{state['book_title']}' a real published novel or book?"),
    ])
    found = "yes" in response.content.strip().lower()
    return {
        "book_found": found,
        "error_message": "" if found else f"Could not find '{state['book_title']}'. Please check the title.",
    }


# ─────────────────────────────────────────────
# NODE 2: extract_characters
# ─────────────────────────────────────────────

def extract_characters_node(state: CharacterGraphState) -> dict:
    llm = make_llm()
    system = """You extract character information from books.
Return ONLY a valid JSON array of character objects. No markdown, no explanation.
Schema: [{"name": "...", "role": "protagonist|antagonist|supporting|minor", "personality": "2-4 adjectives", "arc": "one sentence describing their journey"}]
Include all major and supporting characters (5-12 total)."""

    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=f"List all characters in '{state['book_title']}'."),
    ])

    raw = response.content.strip().replace("```json", "").replace("```", "")
    try:
        chars_data = json.loads(raw)
        characters = []
        for c in chars_data:
            characters.append({
                "name": c.get("name", "Unknown"),
                "role": c.get("role", "supporting"),
                "personality": c.get("personality", ""),
                "arc": c.get("arc", ""),
            })
    except (json.JSONDecodeError, TypeError):
        characters = []

    return {
        "characters": characters,
        "raw_character_data": raw,
    }


# ─────────────────────────────────────────────
# NODE 3: extract_relationships
# ─────────────────────────────────────────────

def extract_relationships_node(state: CharacterGraphState) -> dict:
    llm = make_llm()
    char_names = [c["name"] for c in state.get("characters", [])]
    system = """You extract character relationships from books.
Return ONLY a valid JSON array. No markdown, no explanation.
Schema: [{"source": "char name", "target": "char name", "type": "ally|rival|romantic|family|mentor|colleague", "strength": 1-5, "description": "one sentence"}]
Only include meaningful relationships between named characters."""

    user_msg = (
        f"Book: '{state['book_title']}'\n"
        f"Characters: {', '.join(char_names)}\n\n"
        "List all meaningful relationships between these characters."
    )

    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=user_msg),
    ])

    raw = response.content.strip().replace("```json", "").replace("```", "")
    try:
        rels_data = json.loads(raw)
        relationships = []
        valid_names = set(char_names)
        for r in rels_data:
            src = r.get("source", "")
            tgt = r.get("target", "")
            if src in valid_names and tgt in valid_names and src != tgt:
                relationships.append({
                    "source": src,
                    "target": tgt,
                    "type": r.get("type", "ally"),
                    "strength": max(1, min(5, int(r.get("strength", 3)))),
                    "description": r.get("description", ""),
                })
    except (json.JSONDecodeError, TypeError, ValueError):
        relationships = []

    return {"relationships": relationships}


# ─────────────────────────────────────────────
# NODE 4: format_graph
# ─────────────────────────────────────────────

def format_graph_node(state: CharacterGraphState) -> dict:
    nodes = []
    for c in state.get("characters", []):
        role = c.get("role", "supporting").lower()
        if "protag" in role:
            role = "protagonist"
        elif "antag" in role:
            role = "antagonist"
        elif "minor" in role:
            role = "minor"
        else:
            role = "supporting"

        nodes.append({
            "id": c["name"],
            "label": c["name"],
            "role": role,
            "personality": c.get("personality", ""),
            "arc": c.get("arc", ""),
            "size": ROLE_SIZE.get(role, 18),
        })

    links = []
    for r in state.get("relationships", []):
        links.append({
            "source": r["source"],
            "target": r["target"],
            "type": r.get("type", "ally"),
            "strength": r.get("strength", 3),
            "description": r.get("description", ""),
        })

    return {
        "graph_data": {
            "nodes": nodes,
            "links": links,
            "character_count": len(nodes),
            "relationship_count": len(links),
        }
    }


def not_found_node(state: CharacterGraphState) -> dict:
    return {
        "graph_data": {
            "nodes": [],
            "links": [],
            "character_count": 0,
            "relationship_count": 0,
            "error": state.get("error_message", "Book not found."),
        }
    }


def route_after_validation(state: CharacterGraphState) -> str:
    return "extract_characters" if state.get("book_found") else "not_found"


def build_character_graph():
    builder = StateGraph(CharacterGraphState)
    builder.add_node("validate_book", validate_book_node)
    builder.add_node("not_found", not_found_node)
    builder.add_node("extract_characters", extract_characters_node)
    builder.add_node("extract_relationships", extract_relationships_node)
    builder.add_node("format_graph", format_graph_node)

    builder.add_edge(START, "validate_book")
    builder.add_edge("not_found", END)
    builder.add_edge("extract_characters", "extract_relationships")
    builder.add_edge("extract_relationships", "format_graph")
    builder.add_edge("format_graph", END)

    builder.add_conditional_edges(
        "validate_book",
        route_after_validation,
        {
            "extract_characters": "extract_characters",
            "not_found": "not_found",
        },
    )
    return builder.compile()


character_graph = build_character_graph()


async def run_character_graph(book_title: str) -> dict:
    initial_state: CharacterGraphState = {
        "book_title": book_title,
        "book_found": False,
        "error_message": "",
        "raw_character_data": "",
        "characters": [],
        "relationships": [],
        "graph_data": {},
    }
    final_state = await character_graph.ainvoke(initial_state)
    return final_state["graph_data"]
