from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.recommend import router as recommend_router
from routers.graph import router as graph_router
from routers.chat import router as chat_router
from routers.profile import router as profile_router
from routers.pace import router as pace_router
from routers.similarity import router as similarity_router
from routers.debate import router as debate_router
from routers.summary import router as summary_router
from routers.plan import router as plan_router

app = FastAPI(
    title="BookTwin API",
    description="AI book recommendation engine powered by LangGraph + Groq",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(pace_router, prefix="/api")
app.include_router(similarity_router, prefix="/api")
app.include_router(debate_router, prefix="/api")
app.include_router(summary_router, prefix="/api")
app.include_router(plan_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
