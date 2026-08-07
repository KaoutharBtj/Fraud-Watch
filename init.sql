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

    action_taken                              TEXT
);


CREATE INDEX IF NOT EXISTS idx_fraud_decisions_created_at
    ON fraud_decisions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_customer_id
    ON fraud_decisions (customer_id);

CREATE INDEX IF NOT EXISTS idx_fraud_decisions_final_decision
    ON fraud_decisions (final_decision);