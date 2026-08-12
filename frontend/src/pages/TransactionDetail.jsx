// src/pages/TransactionDetail.jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState } from '../components/PageStates'
import StatusBadge from '../components/StatusBadge'
import RiskMeter from '../components/RiskMeter'
import { api, ApiError } from '../lib/api'

const NEXT_STEP = {
  BLOCK: 'REVIEW',
  REVIEW: 'APPROVE',
}

export default function TransactionDetail() {
  const { auditId } = useParams()
  const { data: tx, loading, error } = useApi(`/transactions/${auditId}`, [auditId])
  const [current, setCurrent] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  // Keep a local copy so the badge/button update instantly after an override,
  // without waiting on a full refetch.
  const displayed = current || tx

  async function handleOverride() {
    const nextDecision = NEXT_STEP[displayed.final_decision]
    if (!nextDecision) return

    setUpdating(true)
    setUpdateError(null)
    try {
      const updated = await api.patch(`/transactions/${auditId}/decision`, {
        new_decision: nextDecision,
      })
      setCurrent(updated)
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Could not update decision.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      <Link to="/transactions" className="back-link">
        ← Back to transactions
      </Link>

      {loading && <Loading label="Loading transaction…" />}
      {error && <ErrorState message={error} />}

      {displayed && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h3 className="mono" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
              {displayed.audit_id}
            </h3>
            <StatusBadge decision={displayed.final_decision} />

            {NEXT_STEP[displayed.final_decision] && (
              <button
                onClick={handleOverride}
                disabled={updating}
                className="override-btn"
              >
                {updating
                  ? 'Updating…'
                  : `Move to ${NEXT_STEP[displayed.final_decision]}`}
              </button>
            )}
          </div>

          {updateError && (
            <p style={{ color: 'var(--risk-block)', fontSize: 13, marginBottom: 16 }}>
              {updateError}
            </p>
          )}

          {displayed.previous_decision && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Originally <strong>{displayed.previous_decision}</strong>, changed to{' '}
              <strong>{displayed.final_decision}</strong> by{' '}
              <span className="mono">{displayed.decision_updated_by}</span> on{' '}
              {new Date(displayed.decision_updated_at).toLocaleString()}
            </p>
          )}

          <div className="detail-grid">
            <div>
              <div className="detail-card">
                <h3>Transaction</h3>
                <Field label="Customer" value={<Link to={`/customers/${displayed.customer_id}`}>#{displayed.customer_id}</Link>} />
                <Field label="Amount" value={`$${displayed.amount.toFixed(2)}`} mono />
                <Field label="Country" value={displayed.country} />
                <Field label="Device" value={displayed.device} />
                <Field label="Hour" value={`${displayed.hour}:00`} mono />
                <Field label="Transactions in last hour" value={displayed.tx_last_hour} mono />
                <Field label="Processed at" value={new Date(displayed.created_at).toLocaleString()} />
              </div>

              <div className="detail-card">
                <h3>LLM reasoning</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
                  {displayed.llm_reasoning || 'No reasoning recorded.'}
                </p>
                {displayed.top_signals && displayed.top_signals.length > 0 && (
                  <div className="signal-list">
                    {displayed.top_signals.map((s, i) => (
                      <span className="signal-chip" key={i}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-card">
                <h3>Action taken</h3>
                <p style={{ fontSize: 14, marginTop: 12 }}>{displayed.action_taken || '—'}</p>
              </div>
            </div>

            <div>
              <div className="detail-card">
                <h3>Risk score</h3>
                <div style={{ marginTop: 16 }}>
                  <RiskMeter score={displayed.ml_score} size="lg" />
                </div>
              </div>

              <div className="detail-card">
                <h3>Engineered features</h3>
                <Field label="Amount ratio" value={displayed.amount_ratio} mono />
                <Field label="Country changed" value={displayed.country_changed ? 'Yes' : 'No'} />
                <Field label="Device changed" value={displayed.device_changed ? 'Yes' : 'No'} />
                <Field label="Outside active hours" value={displayed.outside_hours ? 'Yes' : 'No'} />
                <Field label="Low-amount probe" value={displayed.low_amount_probe ? 'Yes' : 'No'} />
                <Field label="Amount escalating" value={displayed.amount_escalating ? 'Yes' : 'No'} />
                <Field label="Small tx count" value={displayed.small_tx_count} mono />
              </div>

              {displayed.shap_values && Object.keys(displayed.shap_values).length > 0 && (
                <div className="detail-card">
                  <h3>SHAP contributions</h3>
                  {Object.entries(displayed.shap_values).map(([feature, value]) => (
                    <Field key={feature} label={feature} value={value.toFixed(4)} mono />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .override-btn {
          margin-left: auto;
          background: var(--accent);
          color: #14100c;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 13px;
          padding: 7px 14px;
          cursor: pointer;
        }
        .override-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }
        .override-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div className="field-row">
      <span className="field-row-label">{label}</span>
      <span className={mono ? 'mono' : ''}>{value}</span>
    </div>
  )
}