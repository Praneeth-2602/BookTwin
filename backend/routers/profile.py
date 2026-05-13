"""
Profile router — AI-powered reader profile updates (Phase 4)
"""

import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdateRequest(BaseModel):
    current_profile: str
    new_recommendation: dict
    mood: str


@router.post("/update")
async def update_profile(req: ProfileUpdateRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3, api_key=api_key)

    system = """You update a reader profile JSON based on a new book recommendation.
Return ONLY valid JSON with these exact keys, no markdown:
{
  "summary": "2-3 sentence reader DNA summary",
  "favoriteGenres": ["list", "of", "genres"],
  "recentMoods": ["list", "of", "moods"],
  "readCount": <integer>
}"""

    rec = req.new_recommendation
    user_msg = f"""Current profile: {req.current_profile or "No profile yet — this is the first recommendation."}

New recommendation:
- Book: {rec.get("title", "Unknown")} by {rec.get("author", "Unknown")}
- Genres: {", ".join(rec.get("genres", []))}
- Mood that triggered this: {req.mood}

Update the profile to incorporate these new signals. Increment readCount by 1."""

    try:
        response = llm.invoke([SystemMessage(content=system), HumanMessage(content=user_msg)])
        raw = response.content.strip().replace("```json", "").replace("```", "")
        updated = json.loads(raw)
        return {"updated_profile": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")
