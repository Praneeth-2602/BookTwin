import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from graph.debate_graph import run_debate_graph

router = APIRouter(prefix="/debate", tags=["debate"])


class DebateRequest(BaseModel):
    book_a: str = Field(min_length=1)
    book_b: str = Field(min_length=1)
    reader_profile: str = ""


@router.post("/start")
async def start_debate(req: DebateRequest):
    async def event_stream():
        try:
            result = await run_debate_graph(req.book_a, req.book_b, req.reader_profile or "No saved reader profile.")
            for message in result["messages"]:
                payload = dict(message)
                if message["role"] == "judge":
                    payload["verdict"] = result.get("winner", "")
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(0.45)
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    if req.book_a.strip().lower() == req.book_b.strip().lower():
        raise HTTPException(status_code=400, detail="Choose two different books.")

    return StreamingResponse(event_stream(), media_type="text/event-stream")
