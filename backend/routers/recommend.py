from fastapi import APIRouter, HTTPException
from models.schemas import BookRequest, BookResponse, BookRecommendation, PipelineTrace

router = APIRouter()


@router.post("/recommend", response_model=BookResponse)
async def recommend_book(request: BookRequest):
    # Import here to avoid circular issues at startup
    from graph.book_graph import run_book_graph

    if not request.mood and not request.loved_books:
        raise HTTPException(
            status_code=400,
            detail="Provide at least a mood or one loved book."
        )

    try:
        result = await run_book_graph(
            mood=request.mood,
            loved_books=request.loved_books,
            extra_context=request.extra_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph execution failed: {str(e)}")

    # Handle clarification branch (no recommendation produced)
    if not result.get("recommendation"):
        raise HTTPException(
            status_code=422,
            detail=result.get("clarification_needed", "Insufficient input.")
        )

    rec_data = result["recommendation"]
    recommendation = BookRecommendation(**rec_data)

    trace = [PipelineTrace(**t) for t in result.get("pipeline_trace", [])]

    return BookResponse(
        recommendation=recommendation,
        pipeline_trace=trace,
        graph_path=result.get("graph_path", ""),
    )


@router.get("/health")
async def health():
    return {"status": "ok", "service": "BookTwin API"}
