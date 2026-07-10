from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    hcp_name: Mapped[str] = mapped_column(String(120))

    specialty: Mapped[str] = mapped_column(String(120))

    institution: Mapped[str] = mapped_column(String(150))

    interaction_type: Mapped[str] = mapped_column(String(50))

    interaction_date: Mapped[str] = mapped_column(String(20))

    interaction_time: Mapped[str] = mapped_column(String(20))

    attendees: Mapped[list[str]] = mapped_column(JSON, default=list)

    objective: Mapped[str] = mapped_column(Text)

    summary: Mapped[str] = mapped_column(Text)

    sentiment: Mapped[str] = mapped_column(String(30))

    products_discussed: Mapped[list[str]] = mapped_column(JSON, default=list)

    materials_shared: Mapped[list[str]] = mapped_column(JSON, default=list)

    samples_distributed: Mapped[list[str]] = mapped_column(JSON, default=list)

    next_step: Mapped[str] = mapped_column(Text)

    follow_up_date: Mapped[str] = mapped_column(String(30))

    raw_notes: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )