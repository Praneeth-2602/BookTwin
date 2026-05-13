"""
Chat router — PDF upload + streaming chat endpoints
"""

import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.rag_service import process_pdf, stream_chat

router = APIRouter(prefix="/chat", tags=["chat"])

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await file.read()
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF must be under 10MB.")

    # Write to a temp file — PyPDFLoader needs a path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        session_id, chunk_count, title_guess = process_pdf(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return {
        "session_id": session_id,
        "chunk_count": chunk_count,
        "title_guess": title_guess,
    }


class ChatRequest(BaseModel):
    session_id: str
    message: str


@router.post("/message")
async def chat_message(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    async def event_stream():
        async for chunk in stream_chat(req.session_id, req.message):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
