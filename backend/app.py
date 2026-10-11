
import os
import time
import uuid
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)
# --------------------------------------------------
# 1. LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

LYZR_API_KEY = os.getenv("LYZR_API_KEY")
LYZR_AGENT_ID = os.getenv("LYZR_AGENT_ID")

if not LYZR_API_KEY or not LYZR_AGENT_ID:
    raise RuntimeError(
        "Missing LYZR_API_KEY or LYZR_AGENT_ID in backend/.env"
    )

# --------------------------------------------------
# 2. CONFIGURATION
# --------------------------------------------------

COLLECTION = "voice_memory"
VECTOR_SIZE = 384

app = FastAPI(title="VoiceAble AI Backend", version="1.0.0")

# Allow the local React development server to call FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# --------------------------------------------------
# 3. QDRANT AND EMBEDDINGS
# --------------------------------------------------

# Qdrant server must be running at localhost:6333.
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not QDRANT_URL or not QDRANT_API_KEY:
    raise RuntimeError("Missing Qdrant credentials in backend/.env")

qdrant = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

# Downloads the embedding model on first use.
embedder = TextEmbedding("BAAI/bge-small-en-v1.5")


def ensure_collection():
    """Create the vector collection if it does not exist."""
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )
ensure_collection()
qdrant.create_payload_index(
    collection_name=COLLECTION,
    field_name="uid",
    field_schema="keyword",
    wait=True,
)

def embed(text: str) -> list[float]:
    """Convert text into a 384-dimensional vector."""
    vector = next(iter(embedder.embed([text])))
    return vector.tolist()


def remember(uid: str, text: str, source: str) -> None:
    """Store a text memory for a particular user."""
    if not text.strip():
        return

    qdrant.upsert(
        collection_name=COLLECTION,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embed(text),
                payload={
                    "uid": uid,
                    "text": text,
                    "source": source,
                    "ts": time.time(),
                },
            )
        ],
        wait=True,
    )


def recall(uid: str, question: str, k: int = 5) -> list[str]:
    """Retrieve relevant memories belonging only to this user."""
    hits = qdrant.query_points(
        collection_name=COLLECTION,
        query=embed(question),
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="uid",
                    match=MatchValue(value=uid),
                )
            ]
        ),
        limit=k,
        with_payload=True,
    ).points

    return [
        point.payload["text"]
        for point in hits
        if point.payload and point.payload.get("text")
    ]


# --------------------------------------------------
# 4. LYZR AGENT
# --------------------------------------------------

def ask_lyzr(uid: str, question: str, context: list[str]) -> str:
    """Send the question and retrieved memory to the Lyzr agent."""
    memory_context = "\n".join(f"- {item}" for item in context) or "None"

    try:
        response = requests.post(
            "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            headers={
                "Content-Type": "application/json",
                "x-api-key": LYZR_API_KEY,
            },
            json={
                "user_id": uid,
                "agent_id": LYZR_AGENT_ID,
                "session_id": f"{LYZR_AGENT_ID}-{uid}",
                "message": (
                    "You are VoiceAble AI, a patient and accessible "
                    "digital-task assistant. Use simple language, explain "
                    "one step at a time, and ask only one clarifying "
                    "question when necessary. Treat the memory below as "
                    "context, not as guaranteed truth.\n\n"
                    f"RELEVANT MEMORY:\n{memory_context}\n\n"
                    f"USER QUESTION:\n{question}"
                ),
            },
            timeout=60,
        )

        response.raise_for_status()
        data = response.json()

        answer = data.get("response")
        if not answer:
            raise HTTPException(
                status_code=502,
                detail="Lyzr returned no response. Check the agent configuration.",
            )

        return str(answer)

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach the Lyzr service: {exc}",
        ) from exc


# --------------------------------------------------
# 5. HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {"message": "VoiceAble AI backend is running"}


@app.get("/health")
def health():
    """Check whether the backend can reach Qdrant."""
    try:
        qdrant.get_collections()
        return {"api": "ok", "qdrant": "connected"}
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Qdrant is unavailable: {exc}",
        ) from exc


# --------------------------------------------------
# 6. OMI WEBHOOKS
# --------------------------------------------------

def extract_text_segments(segments: Any) -> str:
    """Safely extract text from a list of transcript segments."""
    if not isinstance(segments, list):
        return ""

    texts = [
        str(segment.get("text", "")).strip()
        for segment in segments
        if isinstance(segment, dict) and segment.get("text")
    ]

    return " ".join(texts).strip()


@app.post("/omi/conversation")
def on_conversation(
    payload: Any = Body(...),
    uid: str | None = None,
):
    """
    Store a completed Omi conversation.

    For initial testing, pass a demo user ID as a query parameter.
    Verify Omi's actual webhook payload before production use.
    """
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Expected a JSON object for the conversation payload.",
        )

    user_id = uid or payload.get("uid") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Missing uid. Supply ?uid=demo-user or map the Omi user ID.",
        )

    segments = payload.get("transcript_segments", [])
    transcript = extract_text_segments(segments)

    structured = payload.get("structured") or {}
    overview = (
        structured.get("overview", "")
        if isinstance(structured, dict)
        else ""
    )

    text = f"{overview} {transcript}".strip()

    if text:
        remember(str(user_id), text, source="conversation")

    return {"status": "ok", "stored": bool(text)}


@app.post("/omi/realtime")
def on_realtime(
    payload: Any = Body(...),
    uid: str | None = None,
    session_id: str = "",
):
    #Store transcript segments received from Omi in real time.
    if isinstance(payload, list):
        segments = payload
    elif isinstance(payload, dict):
        segments = payload.get("segments", [])
    else:
        segments = []

    user_id = uid
    if isinstance(payload, dict):
        user_id = user_id or payload.get("uid") or payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Missing uid. Supply ?uid=demo-user or map the Omi user ID.",
        )

    text = extract_text_segments(segments)

    if text:
        remember(str(user_id), text, source="realtime")

    return {"status": "ok", "stored": bool(text)}


# --------------------------------------------------
# 7. ASK VOICEABLE AI
# --------------------------------------------------

@app.post("/ask")
def ask(body: dict = Body(...)):
    """Retrieve user memories and ask the Lyzr agent."""
    uid = body.get("uid")
    question = body.get("question")

    if not isinstance(uid, str) or not uid.strip():
        raise HTTPException(
            status_code=400,
            detail="A non-empty uid is required.",
        )

    if not isinstance(question, str) or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="A non-empty question is required.",
        )

    try:
        context = recall(uid, question)
        answer = ask_lyzr(uid, question, context)

        return {
            "answer": answer,
            "context": context,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not process the request: {exc}",
        ) from exc
