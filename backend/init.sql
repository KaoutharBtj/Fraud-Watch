CREATE TABLE IF NOT EXISTS analysts (
    id                SERIAL       PRIMARY KEY,
    username          VARCHAR(50)  UNIQUE NOT NULL,
    hashed_password   TEXT         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS customers (
    customer_id     INTEGER      PRIMARY KEY,
    avg_amount      NUMERIC(12,2) NOT NULL,
    usual_country   VARCHAR(5)   NOT NULL,
    usual_device    VARCHAR(20)  NOT NULL,
    active_start    INTEGER      NOT NULL CHECK (active_start BETWEEN 0 AND 23),
    active_end      INTEGER      NOT NULL CHECK (active_end   BETWEEN 0 AND 23)
);


CREATE TABLE IF NOT EXISTS fraud_decisions (
    audit_id            VARCHAR(8)    PRIMARY KEY,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),


    customer_id         INTEGER       NOT NULL REFERENCES customers(customer_id),
    amount               NUMERIC(12,2) NOT NULL,
    country               VARCHAR(5)    NOT NULL,
    device                VARCHAR(20)   NOT NULL,
    hour                  INTEGER       NOT NULL CHECK (hour BETWEEN 0 AND 23),
    tx_last_hour           INTEGER       NOT NULL DEFAULT 1,

    amount_ratio            NUMERIC(10,4) NOT NULL,
    country_changed          BOOLEAN       NOT NULL,
    device_changed            BOOLEAN       NOT NULL,
    outside_hours              BOOLEAN       NOT NULL,

    low_amount_probe            BOOLEAN       NOT NULL DEFAULT FALSE,
    amount_escalating             BOOLEAN       NOT NULL DEFAULT FALSE,
    small_tx_count                  INTEGER       NOT NULL DEFAULT 0,

    ml_score                          NUMERIC(6,2)  NOT NULL,
    shap_values                         JSONB,

    llm_reasoning                        TEXT,
    top_signals                            JSONB,
    final_decision                           VARCHAR(10)  NOT NULL
        CHECK (final_decision IN ('BLOCK', 'REVIEW', 'APPROVE')),

    action_taken                              TEXT,
    
    previous_decision        VARCHAR(10),
    decision_updated_by      VARCHAR(50),
    decision_updated_at      TIMESTAMPTZ
);


CREATE INDEX IF NOT EXISTS idx_fraud_decisions_created_at
    ON fraud_decisions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_customer_id
    ON fraud_decisions (customer_id);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_final_decision
    ON fraud_decisions (final_decision);


-- ── AI Agent chat history ────────────────────────────────────────────────
-- Two normalized tables: conversations (threads) and messages (rows within
-- a thread). ON DELETE CASCADE means deleting a conversation automatically
-- removes all its messages in one statement — no orphaned rows, no need
-- for the application to delete messages first.

CREATE TABLE IF NOT EXISTS agent_conversations (
    id                SERIAL       PRIMARY KEY,
    analyst_username  VARCHAR(50)  NOT NULL REFERENCES analysts(username) ON DELETE CASCADE,
    title             VARCHAR(120) NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id                SERIAL       PRIMARY KEY,
    conversation_id   INTEGER      NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role              VARCHAR(10)  NOT NULL CHECK (role IN ('user', 'agent')),
    content           TEXT         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast "list my conversations, most recent first" (sidebar of past chats)
CREATE INDEX IF NOT EXISTS idx_agent_conversations_analyst
    ON agent_conversations (analyst_username, updated_at DESC);

-- Fast "load all messages for this conversation, in order"
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation
    ON agent_messages (conversation_id, created_at ASC);