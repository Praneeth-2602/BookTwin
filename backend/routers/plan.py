from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from graph.reading_plan_graph import create_plan, get_plan_state, revise_plan
from services.ics_service import generate_reading_plan_ics

router = APIRouter(prefix="/plan", tags=["plan"])


class CreatePlanRequest(BaseModel):
    book_title: str = Field(min_length=1)
    minutes_per_day: int = Field(ge=10, le=240)
    target_date: str
    busy_days: list[str] = []


class RevisePlanRequest(BaseModel):
    plan_id: str
    feedback: str = ""


class ApprovePlanRequest(BaseModel):
    plan_id: str


@router.post("/create")
async def create(req: CreatePlanRequest):
    try:
        state = await create_plan(req.book_title, req.minutes_per_day, req.target_date, req.busy_days)
        return {
            "plan_id": state["plan_id"],
            "book_title": state["book_title"],
            "draft_plan": state["draft_plan"],
            "total_pages": state["total_pages"],
            "status": "awaiting_feedback",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan creation failed: {str(e)}")


@router.post("/revise")
async def revise(req: RevisePlanRequest):
    try:
        feedback = req.feedback or "approve"
        state = await revise_plan(req.plan_id, feedback)
        ics = generate_reading_plan_ics(state["book_title"], state["final_plan"])
        return {"final_plan": state["final_plan"], "status": "approved", "ics_content": ics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan revision failed: {str(e)}")


@router.post("/approve")
async def approve(req: ApprovePlanRequest):
    try:
        state = get_plan_state(req.plan_id)
        final_plan = state.get("final_plan") or state.get("draft_plan", [])
        ics = generate_reading_plan_ics(state.get("book_title", "Book"), final_plan)
        return {"final_plan": final_plan, "status": "approved", "ics_content": ics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan approval failed: {str(e)}")
