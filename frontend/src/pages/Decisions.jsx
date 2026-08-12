// src/pages/Decisions.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState, EmptyState } from '../components/PageStates'
import StatusBadge from '../components/StatusBadge'
import RiskMeter from '../components/RiskMeter'

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Blocked', value: 'BLOCK' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Approved', value: 'APPROVE' },
]

export default function Decisions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState(null)

  const query = filter ? `/decisions?decision=${filter}&limit=50` : '/decisions?limit=50'
  const { data, loading, error } = useApi(query, [filter], { pollMs: 8000 })

  return (
    <div>
      <h3>Decision history</h3>

      <div className="filter-tabs" style={{ marginTop: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-tab${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="data-table-wrap">
        {loading && <Loading label="Loading decisions…" />}
        {error && <ErrorState message={error} />}
        {!loading && !error && data && data.length === 0 && (
          <EmptyState message="No decisions match this filter yet." />
        )}

        {!loading && !error && data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Risk</th>
                <th>Decision</th>
                <th>Top signals</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.audit_id} onClick={() => navigate(`/transactions/${d.audit_id}`)}>
                  <td className="mono">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="mono">#{d.customer_id}</td>
                  <td className="mono">${d.amount.toFixed(2)}</td>
                  <td>
                    <RiskMeter score={d.ml_score} size="sm" />
                  </td>
                  <td>
                    <StatusBadge decision={d.final_decision} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {d.top_signals && d.top_signals.length > 0
                      ? d.top_signals.slice(0, 2).join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}