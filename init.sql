-- db/init.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Authoritative schema for the fraud-detection project.
--
-- Runs automatically when Postgres starts with a FRESH volume
-- (mounted via docker-compose.yml → /docker-entrypoint-initdb.d/init.sql).
--
-- IMPORTANT: if you already have a Postgres volume (postgres_data), Postgres
-- will NOT re-run this file — init scripts only execute once, on first
-- container creation. To apply this on an existing volume, either:
--   a) docker-compose down -v   (deletes the volume, all data lost, then
--      docker-compose up -d re-creates it and runs this file), or
--   b) run this file manually:
--      docker exec -i fraud_postgres psql -U postgres -d fraud_db < db/init.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── customers ──────────────────────────────────────────────────────────────
-- One row per customer profile. Populated by generate_data.py, read by
-- simulator_server.py (GET /profile/{id}) and ingestor_agent.py (via that API).

CREATE TABLE IF NOT EXISTS customers (
    customer_id     INTEGER      PRIMARY KEY,
    avg_amount      NUMERIC(12,2) NOT NULL,
    usual_country   VARCHAR(5)   NOT NULL,
    usual_device    VARCHAR(20)  NOT NULL,
    active_start    INTEGER      NOT NULL CHECK (active_start BETWEEN 0 AND 23),
    active_end      INTEGER      NOT NULL CHECK (active_end   BETWEEN 0 AND 23)
);


-- ── fraud_decisions ───────────────────────────────────────────────────────────
-- One row per transaction processed by the pipeline. Written by
-- action_agent.py._write_audit(), read by chat_agent.py and (soon) the
-- dashboard API.

CREATE TABLE IF NOT EXISTS fraud_decisions (
    audit_id            VARCHAR(8)    PRIMARY KEY,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Raw transaction fields
    customer_id         INTEGER       NOT NULL REFERENCES customers(customer_id),
    amount              NUMERIC(12,2) NOT NULL,
    country              VARCHAR(5)    NOT NULL,
    device               VARCHAR(20)   NOT NULL,
    hour                 INTEGER       NOT NULL CHECK (hour BETWEEN 0 AND 23),
    tx_last_hour         INTEGER       NOT NULL DEFAULT 1,

    -- Original 5 engineered features (detector_agent.py)
    amount_ratio         NUMERIC(10,4) NOT NULL,
    country_changed      BOOLEAN       NOT NULL,
    device_changed       BOOLEAN       NOT NULL,
    outside_hours        BOOLEAN       NOT NULL,

    -- 3 card-testing features (detector_agent.py) — previously computed
    -- but not persisted; now saved so the dashboard can show them.
    low_amount_probe     BOOLEAN       NOT NULL DEFAULT FALSE,
    amount_escalating    BOOLEAN       NOT NULL DEFAULT FALSE,
    small_tx_count       INTEGER       NOT NULL DEFAULT 0,

    -- ML output
    ml_score              NUMERIC(6,2)  NOT NULL,
    shap_values           JSONB,

    -- LLM output
    llm_reasoning          TEXT,
    top_signals             JSONB,
    final_decision           VARCHAR(10)  NOT NULL
        CHECK (final_decision IN ('BLOCK', 'REVIEW', 'APPROVE')),

    -- Action taken
    action_taken             TEXT
);

-- ── Indexes for common dashboard queries ──────────────────────────────────────
-- GET /transactions/recent  → ORDER BY created_at DESC
-- GET /decisions?decision=  → WHERE final_decision = ...
-- GET /customers/{id}       → WHERE customer_id = ...

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_created_at
    ON fraud_decisions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_customer_id
    ON fraud_decisions (customer_id);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_final_decision
    ON fraud_decisions (final_decision);