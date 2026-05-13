"""
RAG Service — PDF processing + streaming chat via ConversationalRetrievalChain
"""

import os
import time
import uuid
import asyncio
import json
from typing import AsyncIterator
from dotenv import load_dotenv

load_dotenv()

_sessions: dict = {}
SESSION_TTL_SECONDS = 30 * 60


def _evict_expired():
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["created_at"] > SESSION_TTL_SECONDS]
    for sid in expired:
        del _sessions[sid]


def process_pdf(pdf_path: str):
    """
    Loads PDF → chunks → FAISS index → ConversationalRetrievalChain.
    Returns (session_id, chunk_count, title_guess).
    """
    from langchain_community.document_loaders import PyPDFLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain.memory import ConversationBufferMemory
    from langchain.chains import ConversationalRetrievalChain
    from langchain_groq import ChatGroq
    from langchain_ollama import OllamaEmbeddings

    _evict_expired()

    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(model="llama-3.3-70b-versatile", streaming=True, api_key=api_key)

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer",
    )
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
    )

    title_guess = "Uploaded Book"
    if docs:
        lines = [l.strip() for l in docs[0].page_content[:300].split("\n") if l.strip()]
        if lines:
            title_guess = lines[0][:60]

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "chain": chain,
        "all_docs": chunks,
        "created_at": time.time(),
        "chunk_count": len(chunks),
        "title_guess": title_guess,
    }

    return session_id, len(chunks), title_guess


def get_session_documents(session_id: str):
    _evict_expired()
    session = _sessions.get(session_id)
    if not session:
        return []
    return session.get("all_docs", [])


async def stream_chat(session_id: str, message: str) -> AsyncIterator[str]:
    """Yields SSE-formatted strings, streaming the answer token by token."""
    if session_id not in _sessions:
        yield f'data: {json.dumps({"error": "Session expired. Please re-upload the PDF."})}\n\n'
        return

    chain = _sessions[session_id]["chain"]

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: chain({"question": message})
        )

        answer = result.get("answer", "")
        source_docs = result.get("source_documents", [])

        # Stream word-by-word
        words = answer.split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else " " + word
            yield f'data: {json.dumps({"token": token})}\n\n'
            await asyncio.sleep(0.018)

        sources = []
        seen = set()
        for doc in source_docs[:3]:
            page = doc.metadata.get("page", None)
            label = f"Page {page + 1}" if isinstance(page, int) else "Source excerpt"
            if label not in seen:
                sources.append(label)
                seen.add(label)

        yield f'data: {json.dumps({"done": True, "sources": sources})}\n\n'

    except Exception as e:
        yield f'data: {json.dumps({"error": str(e)})}\n\n'
