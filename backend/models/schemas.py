from pydantic import BaseModel, Field
from typing import Optional


class BookRequest(BaseModel):
    mood: str = Field(default="", description="Reader's current mood")
    loved_books: list[str] = Field(default=[], description="Books the user loved")
    extra_context: str = Field(default="", description="Extra preferences")


class PipelineTrace(BaseModel):
    step: str
    output: str
    status: str = "done"


class BookRecommendation(BaseModel):
    title: str
    author: str
    year: Optional[int] = None
    genres: list[str] = []
    match_score: str
    why_you_will_love_it: str
    because_you_loved: list[str] = []
    mood_match: str
    caveat: str


class BookResponse(BaseModel):
    recommendation: BookRecommendation
    pipeline_trace: list[PipelineTrace]
    graph_path: str = Field(description="Which conditional path the graph took")
