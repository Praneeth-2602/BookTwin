from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from graph.pace_graph import run_pace_graph

router = APIRouter(prefix="/pace", tags=["pace"])


class PaceRequest(BaseModel):
    book_title: str = Field(min_length=1)
    reading_speed: str = Field(pattern="^(slow|medium|fast)$")


@router.post("/estimate")
async def estimate_pace(req: PaceRequest):
    try:
        result = await run_pace_graph(req.book_title, req.reading_speed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pace graph failed: {str(e)}")

    return {
        "book_title": req.book_title,
        "reading_speed": req.reading_speed,
        "page_count": result["page_count"],
        "word_count": result["word_count"],
        "parts": result["parts"],
        "wpm": result["wpm"],
        "total_days": result["total_days"],
        "daily_minutes": result["daily_minutes"],
        "timeline": result["timeline"],
        "trace": result.get("trace", []),
    }
