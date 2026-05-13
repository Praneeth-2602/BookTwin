from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.similarity_service import compute_similarity

router = APIRouter(prefix="/similarity", tags=["similarity"])


class SimilarityRequest(BaseModel):
    titles: list[str] = Field(min_length=2, max_length=6)


@router.post("/matrix")
async def similarity_matrix(req: SimilarityRequest):
    titles = [t.strip() for t in req.titles if t.strip()]
    if len(titles) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two book titles.")
    try:
        return await compute_similarity(titles)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity failed: {str(e)}")
