"""
AstraToonix Quiz Portal — Leaderboard API
==========================================
FastAPI backend that stores quiz results in MongoDB and serves a
leaderboard (top scorers). Meant to be deployed as its own small
service (e.g. on Render) — the quiz frontend itself stays a static
site and just calls this API over HTTPS.

Endpoints
---------
POST /api/submit-score   -> save one quiz attempt
GET  /api/leaderboard    -> top scorers, ranked
GET  /health             -> uptime check (useful for Render)

Environment variables (see .env.example)
-----------------------------------------
MONGODB_URI   - full MongoDB Atlas connection string
MONGODB_DB    - database name (default: astratoonix_quiz)
API_KEY       - shared secret the frontend must send in the
                X-API-Key header on POST /api/submit-score.
                This isn't real auth (there's no login), just a
                simple guard so random strangers can't spam your
                leaderboard by finding the endpoint.
ALLOWED_ORIGINS - comma-separated list of origins allowed to call
                this API from the browser (your GitHub Pages URL).
"""

import os
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient

# --------------------------------------------------------------------------
# Config from environment
# --------------------------------------------------------------------------
MONGODB_URI = os.environ.get("MONGODB_URI", "")
MONGODB_DB = os.environ.get("MONGODB_DB", "astratoonix_quiz")
API_KEY = os.environ.get("API_KEY", "")
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is not set. "
        "Add it in Render's Environment tab (or a local .env file)."
    )

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]
scores_collection = db["scores"]

app = FastAPI(title="AstraToonix Quiz Leaderboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Startup: make sure useful indexes exist
# --------------------------------------------------------------------------
@app.on_event("startup")
async def ensure_indexes():
    await scores_collection.create_index([("percentage", -1), ("created_at", 1)])
    await scores_collection.create_index("player_name")


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------
class ScoreSubmission(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=40)
    score: int = Field(..., ge=0)
    total: int = Field(..., ge=1)
    category_id: Optional[str] = Field(None, max_length=60)
    category_label: Optional[str] = Field(None, max_length=120)

    @field_validator("player_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v).strip()
        if not v:
            raise ValueError("Name can't be empty")
        return v[:40]

    @field_validator("score")
    @classmethod
    def score_not_over_total(cls, v, info):
        total = info.data.get("total")
        if total is not None and v > total:
            raise ValueError("score can't exceed total")
        return v


class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    score: int
    total: int
    percentage: float
    category_label: Optional[str] = None
    created_at: datetime


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/submit-score")
async def submit_score(payload: ScoreSubmission, x_api_key: str = Header(default="")):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    percentage = round((payload.score / payload.total) * 100, 2)
    doc = {
        "player_name": payload.player_name,
        "score": payload.score,
        "total": payload.total,
        "percentage": percentage,
        "category_id": payload.category_id,
        "category_label": payload.category_label,
        "created_at": datetime.now(timezone.utc),
    }
    result = await scores_collection.insert_one(doc)
    return {"ok": True, "id": str(result.inserted_id)}


@app.get("/api/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    limit: int = Query(10, ge=1, le=100),
    best_per_player: bool = Query(True, description="Only the best attempt per player name"),
):
    if best_per_player:
        pipeline = [
            {"$sort": {"percentage": -1, "created_at": 1}},
            {
                "$group": {
                    "_id": "$player_name",
                    "player_name": {"$first": "$player_name"},
                    "score": {"$first": "$score"},
                    "total": {"$first": "$total"},
                    "percentage": {"$first": "$percentage"},
                    "category_label": {"$first": "$category_label"},
                    "created_at": {"$first": "$created_at"},
                }
            },
            {"$sort": {"percentage": -1, "created_at": 1}},
            {"$limit": limit},
        ]
        docs = await scores_collection.aggregate(pipeline).to_list(length=limit)
    else:
        cursor = scores_collection.find().sort(
            [("percentage", -1), ("created_at", 1)]
        ).limit(limit)
        docs = await cursor.to_list(length=limit)

    entries = []
    for i, d in enumerate(docs, start=1):
        entries.append(
            LeaderboardEntry(
                rank=i,
                player_name=d["player_name"],
                score=d["score"],
                total=d["total"],
                percentage=d["percentage"],
                category_label=d.get("category_label"),
                created_at=d["created_at"],
            )
        )
    return entries
