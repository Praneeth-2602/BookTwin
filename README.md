# BookTwin

AI book recommendation engine using **LangGraph** (full graph with conditional edges) + **FastAPI** + **Next.js** + **Groq**.

---

## Project Structure

```
booktwin/
├── backend/
│   ├── graph/
│   │   └── book_graph.py      ← LangGraph state machine (read this first)
│   ├── models/
│   │   └── schemas.py         ← Pydantic models
│   ├── routers/
│   │   └── recommend.py       ← FastAPI router
│   ├── main.py                ← FastAPI app entry
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx            ← Main UI
    │   └── globals.css
    ├── components/
    │   ├── MoodSelector.tsx
    │   ├── PipelineViz.tsx
    │   └── ResultCard.tsx
    ├── lib/
    │   ├── api.ts              ← fetch wrapper
    │   └── types.ts            ← shared TypeScript types
    └── next.config.js          ← proxies /api → FastAPI
```

---

## LangGraph Concepts in `book_graph.py`

| Concept | Where |
|---|---|
| `TypedDict` State | `BookTwinState` — the shared state flowing through all nodes |
| `add_node` | 8 nodes registered: extract → validate → profile → match → score → explain |
| `add_edge` | Fixed transitions (always execute) |
| `add_conditional_edges` | 2 conditional branches with router functions |
| Router functions | `route_after_validation`, `route_after_scoring` — return next node name as string |
| `MemorySaver` | Checkpointing — graph state persisted per `thread_id` |
| `ainvoke` | Async graph execution |

### Graph Flow

```
START → extract_preferences → validate_input
                                    │
                     ┌──────────────┴──────────────────┐
                     ▼ (has info)                       ▼ (no info)
              build_reader_profile            request_clarification → END
                     │
                  match_books → score_candidates
                                      │
                     ┌────────────────┴────────────────┐
                     ▼ (confidence ≥ 70)               ▼ (low confidence)
              generate_explanation             broaden_search
                     │                                  │
                     └──────────────┬───────────────────┘
                                    ▼
                                   END
```

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GROQ_API_KEY=your_key_here
# Get a free key at: https://console.groq.com

python main.py
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:3000
```

### 3. Get your Groq API key

1. Go to https://console.groq.com
2. Create a free account
3. Generate an API key
4. Paste it into `backend/.env`

---

## API

### `POST /api/recommend`

```json
{
  "mood": "Contemplative & slow",
  "loved_books": ["Piranesi", "The Secret History"],
  "extra_context": "No romance subplots"
}
```

Response includes:
- `recommendation` — full book rec with match score, explanation, caveats
- `pipeline_trace` — each graph node's output
- `graph_path` — which conditional branches were taken

---

## Learning Notes

### LCEL (LangChain Expression Language)
Each node uses the `prompt | llm | parser` pattern:
```python
messages = [SystemMessage(...), HumanMessage(...)]
response = llm.invoke(messages)   # ← this is the chain
```

### Conditional Edges
```python
builder.add_conditional_edges(
    "validate_input",          # source node
    route_after_validation,    # router fn → returns string
    {
        "build_reader_profile": "build_reader_profile",
        "request_clarification": "request_clarification",
    }
)
```

### State flows through every node
```python
class BookTwinState(TypedDict):
    mood: str
    loved_books: list[str]
    # ... every field any node might read or write
```

Each node receives the full state and returns only the fields it updates.
