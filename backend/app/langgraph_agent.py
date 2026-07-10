from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from typing import Any

import groq
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from .config import DEFAULT_GROQ_MODEL, GROQ_API_KEY


@dataclass
class AgentResult:
    reply: str
    tool_name: str | None = None
    tool_result: dict[str, Any] | None = None


def _clean_json(text: str) -> dict:
    """Strip markdown code fences and parse JSON, with a clear error on failure."""
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


class CRMGraphService:

    def __init__(self, db: Session):

        self.db = db

        self.model = ChatGroq(
            model=DEFAULT_GROQ_MODEL,
            api_key=GROQ_API_KEY,
            temperature=0,
        )

        self.tools = self._build_tools()

        self.agent = create_react_agent(
            self.model,
            self.tools,
            prompt=self._system_prompt(),
        )

    def _system_prompt(self):

        return """
You are an AI CRM Assistant.

Your job is ONLY to extract structured information
from doctor's interaction notes.

If the user provides doctor interaction notes,
ALWAYS call log_interaction first.

Do not call
- draft_follow_up
- recommend_next_best_action
- fetch_hcp_context
- edit_interaction

unless the user explicitly asks for those actions.

For interaction notes, your only task is extraction.

If the user asks a normal question like
'help', 'hello', or 'what can you do',
reply normally without using any tool.

Never invent information.

IMPORTANT RULES

1. Never save anything to database.

2. Never search database.

3. Never invent missing information.

4. Always call the appropriate tool.

5. Return structured JSON.

Available tools:

1. log_interaction
2. edit_interaction
3. fetch_hcp_context
4. recommend_next_best_action
5. draft_follow_up

Return JSON only when a tool is used.
"""

    def _build_tools(self):

        @tool("log_interaction")
        def log_interaction(raw_notes: str) -> dict:
            """
            Extract CRM fields from doctor's interaction notes.
            """

            today = date.today()

            prompt = f"""
Extract the following fields.

Return ONLY JSON.

Today's actual date is {today.isoformat()} ({today.strftime('%A')}).
Use this to resolve any relative date/time language in the notes
(e.g. "today", "yesterday", "next Monday", "in two weeks") into
real calendar dates.

Format rules:
- interaction_date and follow_up_date MUST be in YYYY-MM-DD format.
- interaction_time MUST be in 24-hour HH:MM format (e.g. "11:00 AM" -> "11:00", "3:30 PM" -> "15:30").
- If a field truly cannot be determined from the notes, use an empty string "" rather than omitting the key.

Fields:

hcp_name
specialty
institution
interaction_type
interaction_date
interaction_time
attendees
objective
summary
sentiment
products_discussed
materials_shared
samples_distributed
next_step
follow_up_date
raw_notes

Interaction:

{raw_notes}
"""

            response = self.model.invoke(prompt)
            return _clean_json(response.content)

        @tool("edit_interaction")
        def edit_interaction(
            original_notes: str,
            edit_instruction: str,
        ) -> dict:
            """
            Edit an already extracted interaction.
            """

            prompt = f"""
You are editing a CRM interaction.

Today's actual date is {date.today().isoformat()} ({date.today().strftime('%A')}).
Use this to resolve any relative date/time language (e.g. "today",
"next Monday", "in two weeks") into real calendar dates.

Format rules:
- interaction_date and follow_up_date MUST be in YYYY-MM-DD format.
- interaction_time MUST be in 24-hour HH:MM format.

Original interaction:

{original_notes}

User instruction:

{edit_instruction}

Update the interaction.

Return ONLY JSON with these fields:

hcp_name
specialty
institution
interaction_type
interaction_date
interaction_time
attendees
objective
summary
sentiment
products_discussed
materials_shared
samples_distributed
next_step
follow_up_date
raw_notes
"""

            response = self.model.invoke(prompt)
            return _clean_json(response.content)

        @tool("fetch_hcp_context")
        def fetch_hcp_context(hcp_name: str) -> dict:
            """
            Return basic context for an HCP.
            This version DOES NOT query the database.
            """

            prompt = f"""
Generate a short CRM context for the following HCP.

Doctor:

{hcp_name}

Return ONLY JSON.

Fields:

hcp_name
specialty
possible_focus_area
recommended_discussion
"""

            response = self.model.invoke(prompt)
            return _clean_json(response.content)

        @tool("recommend_next_best_action")
        def recommend_next_best_action(summary: str) -> dict:
            """
            Suggest next best action after an interaction.
            """

            prompt = f"""
Based on this interaction summary,

{summary}

Suggest:

Return ONLY JSON

Fields:

recommendation
reason
priority
"""

            response = self.model.invoke(prompt)
            return _clean_json(response.content)

        @tool("draft_follow_up")
        def draft_follow_up(summary: str) -> dict:
            """
            Generate a follow-up email from the interaction summary.
            """

            prompt = f"""
You are a pharmaceutical CRM assistant.

Based on this interaction:

{summary}

Write a professional follow-up email.

Return ONLY JSON.

Fields:

subject
body
"""

            response = self.model.invoke(prompt)
            return _clean_json(response.content)

        return [
            log_interaction,
            edit_interaction,
            fetch_hcp_context,
            recommend_next_best_action,
            draft_follow_up,
        ]

    def chat(
        self,
        message: str,
        hcp_id: int | None = None,
        interaction_id: int | None = None,
    ) -> AgentResult:

        try:
            result = self.agent.invoke(
                {"messages": [HumanMessage(content=message)]}
            )
        except groq.BadRequestError:
            # The model emitted a malformed / non-JSON tool call and Groq's
            # server-side parser rejected it. Fail soft instead of 500ing.
            return AgentResult(
                reply=(
                    "I had trouble structuring that request. Could you "
                    "rephrase the notes, e.g. 'I met Dr. X, a Cardiologist "
                    "at Y Hospital, we discussed Z...'?"
                ),
                tool_name=None,
                tool_result=None,
            )
        except json.JSONDecodeError:
            # A tool ran but the model's JSON body couldn't be parsed.
            return AgentResult(
                reply="I extracted a response but it wasn't valid JSON. Please try again.",
                tool_name=None,
                tool_result=None,
            )

        messages = result["messages"]

        final_reply = ""
        tool_name = None
        tool_result = None

        # Find tool output
        for msg in messages:
            if getattr(msg, "type", "") == "tool":
                tool_name = getattr(msg, "name", None)
                try:
                    tool_result = json.loads(msg.content)
                except Exception:
                    tool_result = msg.content

        # Find final AI reply
        for msg in reversed(messages):
            if getattr(msg, "type", "") == "ai":
                final_reply = msg.content
                break

        return AgentResult(
            reply=final_reply,
            tool_name=tool_name,
            tool_result=tool_result,
        )

    def run_tool(self, tool_name: str, payload: dict):

        for t in self.tools:
            if t.name == tool_name:
                return t.invoke(payload)

        raise ValueError(f"Unknown tool: {tool_name}")