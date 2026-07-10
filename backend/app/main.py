from __future__ import annotations



from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import APP_TITLE, APP_VERSION
from .db import Base, engine, get_db
from .langgraph_agent import CRMGraphService
from .models import Interaction
from .schemas import (
    ChatRequest,
    ChatResponse,
    DashboardResponse,
    InteractionCreate,
    InteractionRead,
    InteractionUpdate,
)

app = FastAPI(title=APP_TITLE, version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    interactions = db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    return DashboardResponse(
        interactions=[InteractionRead.model_validate(row) for row in interactions],
    )


@app.get("/api/interactions", response_model=list[InteractionRead])
def list_interactions(db: Session = Depends(get_db)):
    return [
        InteractionRead.model_validate(row)
        for row in db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    ]


@app.post("/api/interactions", response_model=InteractionRead)
def create_interaction(
    payload: InteractionCreate,
    db: Session = Depends(get_db),
):

    interaction = Interaction(
        hcp_name=payload.hcp_name,
        specialty=payload.specialty,
        institution=payload.institution,
        interaction_type=payload.interaction_type,
        interaction_date=payload.interaction_date,
        interaction_time=payload.interaction_time,
        attendees=payload.attendees,
        objective=payload.objective,
        summary=payload.summary,
        sentiment=payload.sentiment,
        products_discussed=payload.products_discussed,
        materials_shared=payload.materials_shared,
        samples_distributed=payload.samples_distributed,
        next_step=payload.next_step,
        follow_up_date=payload.follow_up_date,
        raw_notes=payload.raw_notes,
    )

    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    return InteractionRead.model_validate(interaction)


@app.put("/api/interactions/{interaction_id}", response_model=InteractionRead)
def update_interaction(
    interaction_id: int,
    payload: InteractionUpdate,
    db: Session = Depends(get_db),
):
    interaction = db.get(Interaction, interaction_id)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Interaction not found")

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    for field, value in updates.items():
        setattr(interaction, field, value)

    db.commit()
    db.refresh(interaction)

    return InteractionRead.model_validate(interaction)


@app.post("/api/agent/chat", response_model=ChatResponse)
def extract_interaction(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):

    service = CRMGraphService(db)
    result = service.chat(payload.message)

    return ChatResponse(
        reply=result.reply,
        tool_name=result.tool_name,
        tool_result=result.tool_result,
    )

