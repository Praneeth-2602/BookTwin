"""
Phase 6 — Book Similarity Heatmap

LangChain concept to study:
- RunnableParallel starts independent description chains together.
- RunnableLambda wraps normal Python functions as LCEL runnables.
- Embeddings become regular vectors that you can compare with cosine similarity.
"""

import json
import os

import numpy as np
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda, RunnableParallel
from langchain_groq import ChatGroq


def make_llm(temperature: float = 0.3) -> ChatGroq:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=temperature, api_key=api_key)


def get_book_description(title: str) -> str:
    llm = make_llm()
    response = llm.invoke([
        SystemMessage(content="Describe this book's themes, tone, style, and reader appeal in exactly 3 sentences."),
        HumanMessage(content=title),
    ])
    return response.content.strip()


def _description_runnable(title: str) -> RunnableLambda:
    return RunnableLambda(lambda _: get_book_description(title))


def build_parallel_description_chain(titles: list[str]) -> RunnableParallel:
    return RunnableParallel(**{
        f"book_{i}": _description_runnable(title)
        for i, title in enumerate(titles)
    })


def embed_descriptions(descriptions: list[str]) -> list[list[float]]:
    try:
        from langchain_ollama import OllamaEmbeddings
        embedder = OllamaEmbeddings(model="nomic-embed-text")
        return embedder.embed_documents(descriptions)
    except Exception:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return embedder.embed_documents(descriptions)


def cosine_similarity_matrix(embeddings: list[list[float]]) -> list[list[float]]:
    mat = np.array(embeddings, dtype=float)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1
    mat = mat / norms
    matrix = mat @ mat.T
    return np.clip(matrix, 0, 1).round(3).tolist()


def build_explanations(titles: list[str], descriptions: list[str], matrix: list[list[float]]) -> list[list[str]]:
    llm = make_llm(temperature=0.2)
    prompt = f"""Create an NxN JSON matrix of short explanations for book similarity.
Titles: {json.dumps(titles)}
Descriptions: {json.dumps(descriptions)}
Similarity matrix: {json.dumps(matrix)}

Return ONLY JSON shaped as string[][]. Diagonal cells should say "Same book." Each off-diagonal explanation must be one sentence."""
    try:
        response = llm.invoke([
            SystemMessage(content="You explain literary similarity briefly. Return only valid JSON."),
            HumanMessage(content=prompt),
        ])
        raw = response.content.strip().replace("```json", "").replace("```", "")
        parsed = json.loads(raw)
        if len(parsed) == len(titles):
            return parsed
    except Exception:
        pass

    return [
        [
            "Same book." if i == j else f"Both books overlap in tone, themes, or reader appeal ({matrix[i][j]:.2f})."
            for j in range(len(titles))
        ]
        for i in range(len(titles))
    ]


async def compute_similarity(titles: list[str]) -> dict:
    cleaned = [t.strip() for t in titles if t.strip()][:6]
    chain = build_parallel_description_chain(cleaned)
    desc_map = await chain.ainvoke({})
    descriptions = [desc_map[f"book_{i}"] for i in range(len(cleaned))]
    embeddings = embed_descriptions(descriptions)
    matrix = cosine_similarity_matrix(embeddings)
    explanations = build_explanations(cleaned, descriptions, matrix)
    return {
        "titles": cleaned,
        "descriptions": descriptions,
        "matrix": matrix,
        "explanations": explanations,
    }
