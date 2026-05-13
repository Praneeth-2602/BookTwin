from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.summary_service import summarize_until_chapter

router = APIRouter(prefix="/chat", tags=["summary"])


class SummaryRequest(BaseModel):
    session_id: str
    chapter_limit: int = Field(ge=1, le=80)


@router.post("/summarize")
async def summarize(req: SummaryRequest):
    try:
        return await summarize_until_chapter(req.session_id, req.chapter_limit)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")
