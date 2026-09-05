# Fraud Watch — Fraud Detection Dashboard

Real-time fraud detection platform: a Kafka pipeline scores incoming
transactions with an ML model + LLM reasoning agent, and analysts review
results through a React dashboard backed by a FastAPI API.

## Architecture

```
internship-Project/
├── backend/          # Python: pipeline, API, database
└── frontend/         # React (Vite) dashboard
```

| Service | What it does | How it runs |
|---|---|---|
| Kafka | Transaction event queue | Docker |
| PostgreSQL | Stores transactions, decisions, analysts, agent chats | Docker |
| API (FastAPI) | REST API the dashboard talks to | Docker |
| Frontend (React/Nginx) | The dashboard UI | Docker |
| Pipeline (`main.py`) | Consumes transactions, scores them, writes decisions | Run directly (`python main.py`) |
| Simulator (`simulator_server.py`) | Generates fake transactions for testing | Run directly |
| Ollama | Local LLM for reasoning + chat agent | Run directly on host |

## Prerequisites

- Docker Desktop
- Python 3.12+
- Node.js 20+
- [Ollama](https://ollama.com) with `ollama pull qwen3:8b`

## Setup

```bash
cd backend
cp .env.exemple .env       # fill in real values, especially JWT_SECRET_KEY:
                            #   python -c "import secrets; print(secrets.token_hex(32))"

pip install -r requirements.txt
```

## Running

**1. Start Kafka, Postgres, API, and the frontend:**

```bash
cd backend
docker-compose up -d --build
```

**2. Apply the database schema** (first run only, or after `init.sql` changes):

```bash
python apply_schema.py
```

**3. Create your first analyst account:**

```bash
python create-admin.py
```

**4. Start the pipeline and simulator** (not containerized — run directly):

```bash
python simulator_server.py   # terminal 1
python main.py                # terminal 2
```

**5. Open the app:**

- Dashboard: http://localhost:3000
- API docs: http://127.0.0.1:8001/docs

## Frontend development mode

For active frontend development with hot-reload (instead of the Nginx
container):

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Useful scripts

| Script | Purpose |
|---|---|
| `create-admin.py` | Create a new analyst login |
| `account_recovery.py` | List usernames / reset a forgotten password |
| `apply_schema.py` | Re-apply `init.sql` without needing `psql` |

## Tech stack

FastAPI · PostgreSQL · Kafka · React (Vite) · scikit-learn · Ollama (qwen3:8b) · Docker