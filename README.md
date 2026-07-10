# AI-First CRM — HCP Module: Log Interaction Screen

An AI-first CRM module for pharmaceutical field representatives, built around a single
core workflow: **logging an interaction with a Healthcare Professional (HCP)**, either
through a structured form or a conversational AI assistant.

The assistant is powered by a **LangGraph agent** backed by a **Groq-hosted LLM**, which
extracts structured CRM fields from free-text notes and can populate the form
automatically — the rep reviews/edits, then saves.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Redux Toolkit, `react-hook-form` for form state/validation |
| Backend | Python, FastAPI |
| AI Agent Framework | LangGraph (`create_react_agent`) |
| LLM Provider | Groq (see [Environment Variables](#environment-variables) for the exact model) |
| Database | MySQL (via SQLAlchemy + `pymysql`) |
| Styling | Custom Tailwind-based UI kit, Google Inter font |

> **Note:** The original project brief called for Redux for frontend state management.
> The current implementation manages form state with `react-hook-form` instead, and uses
> local component state (`useState`) for the chat panel. If Redux is a hard grading
> requirement, this is a known gap to revisit before submission.

---

## How It Works

The **Log Interaction** screen offers two ways to capture a field visit:

1. **Structured form** — fill in HCP name, interaction type, date/time, attendees,
   topics discussed, materials/samples shared, sentiment, outcomes, and follow-up
   actions directly.
2. **Conversational assistant** — type a natural-language description of the visit
   (e.g. *"Met Dr. Sarah Johnson, a Cardiologist at City Heart Hospital, discussed
   CardioX, shared a brochure and clinical study PDF, positive sentiment, distributed
   one sample kit"*) into the chat panel. The LangGraph agent extracts structured
   fields via the LLM and **auto-fills the form** for the rep to review, edit, and save.

Saving is always an explicit, separate step — the AI never writes to the database on
its own. The rep reviews the extracted/edited data and clicks **Save Interaction**,
which sends a plain REST call to persist the record.

---

## LangGraph Agent & Tools

The agent's role is to sit between the rep's natural-language input and the CRM's
structured data model: it interprets free text, decides which action is relevant, and
either extracts/generates structured JSON or answers conversationally (e.g. for
"help" or "hello"). It is intentionally restricted from writing to the database or
inventing information not present in the rep's notes — extraction and persistence are
kept as two separate, deliberate steps.

Five tools are defined:

1. **`log_interaction`** — Takes raw interaction notes and prompts the LLM to extract
   a structured JSON object: HCP name, specialty, institution, interaction type,
   date/time, attendees, objective, summary, sentiment, products discussed, materials
   shared, samples distributed, next step, and follow-up date. This is returned to the
   frontend as `tool_result`, which pre-fills the Log Interaction form fields — it does
   **not** write to the database itself.

2. **`edit_interaction`** — Given the original notes and a natural-language edit
   instruction (e.g. *"change the sentiment to negative and add a follow-up call next
   week"*), re-generates the full structured JSON with the requested changes applied.
   (Note: the `PUT /api/interactions/{id}` endpoint used by the form's "save changes"
   flow updates the database directly with the given field values, rather than routing
   through this tool — it's a simpler, more deterministic path for structured edits.
   This tool is available for conversational, free-text edit requests.)

3. **`fetch_hcp_context`** — Given an HCP name, asks the LLM to generate a short
   contextual briefing (specialty, likely focus area, recommended discussion points).
   This is LLM-generated context, not a database lookup — there is no persisted HCP
   directory in this implementation (see [Design Notes](#design-notes)).

4. **`recommend_next_best_action`** — Given an interaction summary, suggests a
   recommended next action, a reason, and a priority level for the rep to follow up on.

5. **`draft_follow_up`** — Given an interaction summary, drafts a professional
   follow-up email (subject + body) the rep can send to the HCP.

---

## Design Notes

- **No dedicated HCP table.** Earlier iterations of this project included a separate
  `HCP` database table. It was removed per the current project scope — `hcp_name` (and
  related fields like specialty/institution) live directly on the `Interaction` record
  as free text, rather than being a foreign key into a managed HCP directory. As a
  result there is no `/api/hcps` endpoint.
- **Extraction and persistence are decoupled.** The chat-based `log_interaction` tool
  only returns structured data for the form to display — saving to the database always
  goes through the explicit `POST /api/interactions` call, triggered by the Save
  button.

---

## Project Structure

```
backend/
  app/
    main.py              FastAPI app, routes, CORS, startup table creation
    langgraph_agent.py   LangGraph agent, system prompt, 5 tool definitions
    models.py            SQLAlchemy models (Interaction)
    schemas.py           Pydantic request/response schemas
    config.py            App settings (Groq model/key, app title/version)
    db.py                SQLAlchemy engine/session setup
  requirements.txt

frontend/
  src/
    App.tsx              Main screen: structured form + AI chat panel
    services/api.ts       Axios client for backend REST + chat endpoints
    types.ts              Shared TypeScript types
    data/
      hcps.ts             Suggestion lists (materials, samples)
      interaction-defaults.ts  Default form values
    components/
      ui/                 Button, Card, Input, Select, Textarea, etc.
      multi-value-input.tsx
      searchable-hcp-select.tsx
  index.html
  package.json
```

---

## Setup & Run

### Prerequisites

- Python 3.11+ (project has been run against 3.13)
- Node.js 18+
- A running MySQL server (or update `DATABASE_URL` to point at Postgres/SQLite instead)
- A Groq API key — create one at [console.groq.com](https://console.groq.com)

## 1. Database Setup

1. Log in to MySQL:

```bash
mysql -u root -p
```

2. Create the database:

```sql
CREATE DATABASE ai_first_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Create a database user:

```sql
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'crm_pass';
GRANT ALL PRIVILEGES ON ai_first_crm.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
```

4. Import the provided database dump:

```bash
mysql -u crm_user -p ai_first_crm < ai_first_crm.sql
```

Alternatively, you can import `ai_first_crm.sql` using MySQL Workbench or Valentina Studio.

### 2. Backend

From the `backend` folder:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file (or set environment variables directly) in `backend/`:

```bash
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=mysql+pymysql://crm_user:crm_pass@127.0.0.1:3306/ai_first_crm
```

> Make sure the target MySQL database (`ai_first_crm` in the example above) already
> exists — the app creates tables inside it on startup, but does not create the
> database itself.

Start the server:

```bash
uvicorn app.main:app --reload
```

Run this command from inside the `backend` folder (the folder containing the `app`
package) — running it from the repo root will raise `ModuleNotFoundError: No module
named 'app'`.

Verify it's up: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
should return `{"status": "ok"}`.

### 3. Frontend

From the `frontend` folder:

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). The dev server proxies
`/api/*` requests to `http://127.0.0.1:8000`.

> **CORS note:** the backend only allows requests from `http://localhost:5173` and
> `http://127.0.0.1:5173` by default (see `main.py`). If your frontend runs on a
> different port, update `allow_origins` in `main.py` to match, or requests will be
> silently blocked by the browser even though the backend processes them successfully.

### Optional: Connecting with VS Code

The project was developed using the **SQLTools** VS Code extension to connect to the MySQL database. If you want to inspect or manage the database directly from VS Code, install the following extensions:

- SQLTools
- SQLTools MySQL/MariaDB Driver

Create a new SQLTools connection with:

- **Database:** `ai_first_crm`
- **Server:** `127.0.0.1`
- **Port:** `3306`
- **Username:** `crm_user`
- **Password:** `crm_pass`

This step is optional and is only needed if you want to browse or manage the database from VS Code.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for Groq LLM calls |
| `DATABASE_URL` | Yes | SQLAlchemy connection string (MySQL example above) |

The active Groq model is set in `backend/app/config.py` (`DEFAULT_GROQ_MODEL`). The
assignment brief specifies `gemma2-9b-it` as the required model, with
`llama-3.3-70b-versatile` as an acceptable alternative — confirm `config.py` matches
whichever you intend to demo, since larger models are noticeably more reliable at
returning well-formed tool calls.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | List all logged interactions |
| GET | `/api/interactions` | List all logged interactions |
| POST | `/api/interactions` | Save a new interaction |
| PUT | `/api/interactions/{id}` | Update an existing interaction |
| POST | `/api/agent/chat` | Send a chat message to the LangGraph agent |

