"""
Phase 8 — Spoiler-Free Chapter Summary

LangChain concept to study:
- map_reduce summarization first maps each document chunk to a mini-summary.
- the reduce step combines those mini-summaries into one coherent answer.
- retrieval here is sequential by metadata, not semantic vector search.
"""

import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

from services.rag_service import get_session_documents


MAP_PROMPT = PromptTemplate.from_template("""
You are summarizing one section of a book. Chapter limit: {chapter_limit}.
Do NOT reveal events beyond chapter {chapter_limit}.
Summarize this passage in 2-3 sentences:

{text}
""")

REDUCE_PROMPT = PromptTemplate.from_template("""
Combine these section summaries into one cohesive spoiler-free overview through chapter {chapter_limit}.
Write 4-6 sentences. No spoilers beyond this chapter.

Summaries:
{text}
""")


def make_llm() -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2, api_key=api_key)


def build_summary_chain(llm):
    from langchain.chains.summarize import load_summarize_chain

    return load_summarize_chain(
        llm,
        chain_type="map_reduce",
        map_prompt=MAP_PROMPT,
        combine_prompt=REDUCE_PROMPT,
        verbose=False,
    )


def get_chapter_docs(session_id: str, chapter_limit: int):
    docs = get_session_documents(session_id)
    if not docs:
        return []
    if chapter_limit <= 0:
        return docs[:80]

    max_page = chapter_limit * 15
    filtered = [
        doc for doc in docs
        if int(doc.metadata.get("page", 0)) + 1 <= max_page
    ]
    return filtered[:80]


async def summarize_until_chapter(session_id: str, chapter_limit: int) -> dict:
    docs = get_chapter_docs(session_id, chapter_limit)
    if not docs:
        raise ValueError("Session expired or no document chunks are available.")

    llm = make_llm()
    try:
        chain = build_summary_chain(llm)
        result = await chain.ainvoke({"input_documents": docs, "chapter_limit": chapter_limit})
        summary = result.get("output_text", "").strip()
    except ModuleNotFoundError:
        mapped = []
        for doc in docs[:30]:
            prompt = MAP_PROMPT.format(chapter_limit=chapter_limit, text=doc.page_content)
            response = await llm.ainvoke([
                SystemMessage(content="Summarize this chunk without spoilers beyond the requested chapter."),
                HumanMessage(content=prompt),
            ])
            mapped.append(response.content.strip())

        reduce_prompt = REDUCE_PROMPT.format(chapter_limit=chapter_limit, text="\n\n".join(mapped))
        response = await llm.ainvoke([
            SystemMessage(content="Combine chunk summaries into one spoiler-free summary."),
            HumanMessage(content=reduce_prompt),
        ])
        summary = response.content.strip()
    return {
        "summary": summary,
        "chapters_covered": chapter_limit,
        "word_count": len(summary.split()),
    }
