# BookTwin v3 LangChain/LangGraph Reading Guide

Use this guide as a code-reading path. Each phase is intentionally small enough to study in one sitting.

## Before The New Features

Start with `backend/graph/book_graph.py`.

Read it in this order:

1. `BookTwinState`
2. the node functions such as `extract_preferences` and `score_candidates`
3. router functions such as `route_after_validation`
4. `build_graph`
5. `run_book_graph`

Core idea: LangGraph passes one shared state dictionary through nodes. Each node returns only the fields it wants to update.

## Phase 5 — Reading Pace Estimator

Files:

- `backend/graph/pace_graph.py`
- `backend/routers/pace.py`
- `frontend/components/PaceEstimator.tsx`

Read `pace_graph.py` first.

Important concepts:

- `@tool` turns `estimate_pages` into a structured LangChain tool.
- `make_llm().bind_tools([estimate_pages])` lets the model request that tool.
- `lookup_book_node` checks `response.tool_calls`.
- `ToolMessage` shows how tool results are sent back into an LLM conversation.
- `calculate_pace_node` is deliberately plain Python so you can see where AI stops and deterministic product logic begins.

Frontend idea: the API is called once, then the minutes-per-day slider recalculates the timeline locally.

## Phase 6 — Book Similarity Heatmap

Files:

- `backend/services/similarity_service.py`
- `backend/routers/similarity.py`
- `frontend/components/ComparePanel.tsx`
- `frontend/components/SimilarityHeatmap.tsx`

Read `similarity_service.py`.

Important concepts:

- `RunnableLambda` wraps `get_book_description` so it behaves like a LangChain runnable.
- `RunnableParallel` runs multiple description calls under one LCEL object.
- `embed_descriptions` converts text into vectors.
- `cosine_similarity_matrix` is normal vector math on LangChain embedding output.

The heatmap is just a visualization of the matrix. The AI work is description generation plus embeddings; the rest is deterministic math.

## Phase 7 — Debate Two Books

Files:

- `backend/graph/debate_graph.py`
- `backend/routers/debate.py`
- `frontend/components/DebatePanel.tsx`
- `frontend/components/DebateMessage.tsx`

Read `DebateState`, then `advocate_node`, then `route_debate`.

Important concepts:

- Each advocate is a graph node with its own role prompt.
- The shared `messages` list is the message-passing channel.
- `route_debate` alternates speakers by looking at `round`.
- After six advocate turns, the route changes to `judge`.
- The router streams the finished graph one turn at a time as SSE.

This is the cleanest example of multi-agent LangGraph in the repo.

## Phase 8 — Spoiler-Free Summary

Files:

- `backend/services/summary_service.py`
- `backend/routers/summary.py`
- `backend/services/rag_service.py`
- `frontend/components/ChatPanel.tsx`
- `frontend/components/ChapterSummary.tsx`

Start in `rag_service.py` and find where `all_docs` is stored in the session. Then read `summary_service.py`.

Important concepts:

- This feature does sequential retrieval, not semantic retrieval.
- `get_chapter_docs` filters chunks by page metadata.
- `build_summary_chain` uses `chain_type="map_reduce"` when the installed LangChain package exposes it.
- The fallback path manually performs the same pattern: map each chunk, then reduce the mapped summaries.

The lesson: RAG does not always mean vector search. Sometimes the correct retrieval policy is page order.

## Phase 9 — Weekly Reading Plan

Files:

- `backend/graph/reading_plan_graph.py`
- `backend/routers/plan.py`
- `backend/services/ics_service.py`
- `frontend/components/PlanPanel.tsx`
- `frontend/components/PlanCalendar.tsx`
- `frontend/lib/feature-api.ts`

Read `build_plan_graph`.

Important concepts:

- `MemorySaver` checkpoints state by `thread_id`.
- `interrupt_before=["await_feedback"]` pauses the graph before `await_feedback_node`.
- `create_plan` runs until the pause and then reads the checkpoint.
- `revise_plan` resumes the same graph using the same `plan_id` as `thread_id`.
- `approve` demonstrates that the saved draft can be accepted without another AI call.

This is the production workflow pattern: generate a draft, pause for a person, resume with feedback.

## API Map

- `POST /api/pace/estimate`
- `POST /api/similarity/matrix`
- `POST /api/debate/start`
- `POST /api/chat/summarize`
- `POST /api/plan/create`
- `POST /api/plan/revise`
- `POST /api/plan/approve`

All new endpoints are wired in `backend/main.py`.

## Suggested Study Order

1. Pace: tool calling is the smallest new concept.
2. Similarity: LCEL parallelism plus embeddings.
3. Debate: multi-agent message passing.
4. Summary: map-reduce and sequential retrieval.
5. Plan: human-in-the-loop graph pausing and resumption.

For every graph file, ask the same questions:

1. What is the state shape?
2. Which node writes which fields?
3. Which edges are fixed?
4. Which edges are conditional?
5. Where does FastAPI call the graph?
6. Which frontend component calls the endpoint?
