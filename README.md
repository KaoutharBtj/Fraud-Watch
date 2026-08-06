# Fraud Detection System

A multi-agent fraud detection pipeline: transactions flow through Kafka, get
enriched with customer profile data, scored by an ML model (Isolation
Forest + SHAP), reasoned about by a local LLM (Ollama), and the final
decision (BLOCK / REVIEW / APPROVE) is written to PostgreSQL along with a
full audit trail.

---

## Architecture

```
simulator_server.py  ──(Kafka topic "transactions")──▶  main.py (consumer)
   (generates fake                                            │
    transactions,                                             ▼
    serves GET /profile/{id})                        orchestrator.py (LangGraph)
                                                                │
                                          ┌─────────────┬───────┴───────┬─────────────┐
                                          ▼             ▼               ▼             ▼
                                     ingestor  →   detector   →   llm_reasoner  →  action
                                  (fetch profile) (ML score+SHAP)  (Ollama LLM)  (decide+log)
                                                                                       │
                                                                                       ▼
                                                                    PostgreSQL: fraud_decisions
```

**Services:**
- **Kafka** — message queue carrying raw transactions from the simulator to the consumer.
- **PostgreSQL** — stores `customers` (profiles) and `fraud_decisions` (every processed transaction + decision + reasoning).
- **Ollama** — runs the local LLM (`qwen3:8b`) used for fraud reasoning and the text-to-SQL chat agent.

---

## Project structure

```
internship-Project/
├── .env                    # your local secrets (gitignored — create from .env.example)
├── .env.example             # committed template
├── .gitignore
├── requirements.txt
├── docker-compose.yml        # Kafka + Postgres
├── init.sql                  # THE database schema — single source of truth
│
├── state.py                  # FraudState type + shared config constants
├── database.py                # Postgres connection factory (used by everything)
│
├── agents/
│   ├── ingestor_agent.py      # fetches customer profile
│   ├── detector_agent.py      # ML scoring + SHAP + card-testing features
│   ├── llm_reasoner_agent.py  # Ollama reasoning → BLOCK/REVIEW/APPROVE
│   └── action_agent.py        # executes decision + writes audit row
├── orchestrator.py             # LangGraph pipeline: wires the 4 agents together
├── main.py                     # Kafka consumer — entry point for the pipeline
│
├── simulator_server.py          # FastAPI: generates transactions + serves /profile/{id}
├── chat_agent.py                 # standalone CLI: ask questions about the data (text-to-SQL)
│
├── generate_data.py               # generates customers + synthetic training data
├── ML_model.py                     # trains/loads the Isolation Forest model
├── isolation_forest.pkl             # (generated, gitignored)
├── risk_scaler.pkl                  # (generated, gitignored)
├── normal_transactions.csv           # (generated, gitignored)
│
├── api/                                # dashboard/reporting API (in progress)
│   └── main.py                          # GET /health so far
└── frontend/                             # React dashboard (not started yet)
```

---

## Prerequisites

- **Docker Desktop** (running)
- **Python 3.x** with `pip`
- **Ollama** installed locally — [ollama.com](https://ollama.com)

---

## Setup — first time only

**1. Clone the repo and enter the folder.**

**2. Create your local environment file:**
```powershell
cp .env.example .env
```
The default values already match `docker-compose.yml` — no editing needed for local development.

**3. Start Kafka + Postgres:**
```powershell
docker-compose up -d
```
Postgres will automatically run `init.sql` on first startup, creating the `customers` and `fraud_decisions` tables.
Wait ~15 seconds for Kafka to fully start.

**4. Install Python dependencies:**
```powershell
python -m pip install -r requirements.txt
```

**5. Pull the LLM model:**
```powershell
ollama pull qwen3:8b
```
Make sure Ollama is running (`ollama list` should succeed without error).

**6. Generate customer profiles + training data:**
```powershell
python generate_data.py
```

**7. Train the ML model:**
```powershell
python ML_model.py
```
This creates `isolation_forest.pkl` and `risk_scaler.pkl`.

---

## Running the project

You need **two terminals**, both in the project root.

**Terminal 1 — transaction generator:**
```powershell
python simulator_server.py
```
Sends a new transaction to Kafka every 15 seconds, and serves `GET http://localhost:8000/profile/{customer_id}`.

**Terminal 2 — the pipeline:**
```powershell
python main.py
```
Consumes transactions from Kafka and runs each one through:
`ingestor → detector → llm_reasoner → action`, printing the decision and writing an audit row to Postgres.

**Optional — ask questions about your data:**
```powershell
python chat_agent.py
```
A CLI that lets you ask things like *"How many transactions were blocked today?"* in plain English; it generates and runs the SQL for you.

---

## Resetting the database

If you need a clean slate (e.g. schema changes, or things get into a weird state):
```powershell
docker-compose down -v
docker-compose up -d
```
`-v` deletes the Postgres volume — `init.sql` will re-run automatically on the next `up`, recreating both tables empty. You'll need to re-run steps 6–7 (`generate_data.py`, `ML_model.py`) afterward, since customer profiles live in Postgres too.

⚠️ **Never create or modify tables by hand in pgAdmin or `psql`.** The schema is defined in `init.sql` — any structural change should be made there, committed, and applied via the reset steps above. Manual changes made outside `init.sql` only exist on your own machine and will be lost (and confuse teammates) the moment the volume is reset.

---

## Notes on the fraud decision thresholds

Configured in `state.py`:
- `BLOCK_THRESHOLD = 80` — ML score ≥ 80 → suggest BLOCK
- `REVIEW_THRESHOLD = 40` — ML score ≥ 40 → suggest REVIEW

The LLM can override these (see `llm_reasoner_agent.py`'s prompt for the exact override rules), but the ML score is always the starting suggestion.

---

## Status / what's next

- Core pipeline (Kafka → agents → Postgres) — working end-to-end
- Database schema (`init.sql`) — defined and version-controlled
- Dashboard API (`api/`) — `GET /health` done, more endpoints in progress
- Frontend dashboard (`frontend/`) — not started