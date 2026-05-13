"""
Graph router — exposes /api/graph/characters
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from graph.character_graph import run_character_graph

router = APIRouter(prefix="/graph", tags=["graph"])


class CharacterGraphRequest(BaseModel):
    book_title: str


@router.post("/characters")
async def get_character_graph(req: CharacterGraphRequest):
    if not req.book_title.strip():
        raise HTTPException(status_code=400, detail="book_title is required")
    try:
        graph_data = await run_character_graph(req.book_title.strip())
        return graph_data
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph generation failed: {str(e)}")
