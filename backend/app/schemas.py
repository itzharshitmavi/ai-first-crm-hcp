from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ---------- Interaction ----------
# Mirrors models.Interaction exactly (also matches the fields the
# log_interaction tool extracts from raw notes).

class InteractionBase(BaseModel):
    hcp_name: str
    specialty: str
    institution: str
    interaction_type: str
    interaction_date: str
    interaction_time: str
    attendees: list[str] = Field(default_factory=list)
    objective: str
    summary: str
    sentiment: str = "Neutral"
    products_discussed: list[str] = Field(default_factory=list)
    materials_shared: list[str] = Field(default_factory=list)
    samples_distributed: list[str] = Field(default_factory=list)
    next_step: str = ""
    follow_up_date: str = ""
    raw_notes: str = ""


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    hcp_name: str | None = None
    specialty: str | None = None
    institution: str | None = None
    interaction_type: str | None = None
    interaction_date: str | None = None
    interaction_time: str | None = None
    attendees: list[str] | None = None
    objective: str | None = None
    summary: str | None = None
    sentiment: str | None = None
    products_discussed: list[str] | None = None
    materials_shared: list[str] | None = None
    samples_distributed: list[str] | None = None
    next_step: str | None = None
    follow_up_date: str | None = None
    raw_notes: str | None = None


class InteractionRead(InteractionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Chat / Agent ----------

class ChatRequest(BaseModel):
    message: str
    mode: str = "conversational"
    hcp_id: int | None = None
    interaction_id: int | None = None


class ChatResponse(BaseModel):
    reply: str
    tool_name: str | None = None
    tool_result: dict | None = None


class ToolDemoRequest(BaseModel):
    tool_name: str
    payload: dict = Field(default_factory=dict)


class ToolDemoResponse(BaseModel):
    tool_name: str
    result: dict


class DashboardResponse(BaseModel):
    interactions: list[InteractionRead]