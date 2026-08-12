// src/pages/Transactions.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState, EmptyState } from '../components/PageStates'
import StatusBadge from '../components/StatusBadge'
import RiskMeter from '../components/RiskMeter'

const PAGE_SIZE = 20

export default function Transactions() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE

  const { data, loading, error } = useApi(
    `/transactions/recent?limit=${PAGE_SIZE}&offset=${offset}`,
    [page],
    { pollMs: 8000 }
  )

  return (
    <div>
      <h3>Recent transactions</h3>

      <div className="data-table-wrap" style={{ marginTop: 16 }}>
        {loading && <Loading label="Loading transactions…" />}
        {error && <ErrorState message={error} />}
        {!loading && !error && data && data.length === 0 && (
          <EmptyState message="No transactions have been processed yet." />
        )}

        {!loading && !error && data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Country</th>
                <th>Device</th>
                <th>Risk</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tx) => (
                <tr
                  key={tx.audit_id}
                  onClick={() => navigate(`/transactions/${tx.audit_id}`)}
                >
                  <td className="mono">{formatTime(tx.created_at)}</td>
                  <td>
                    <Link
                      to={`/customers/${tx.customer_id}`}
                      className="mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{tx.customer_id}
                    </Link>
                  </td>
                  <td className="mono">${tx.amount.toFixed(2)}</td>
                  <td>{tx.country}</td>
                  <td>{tx.device}</td>
                  <td>
                    <RiskMeter score={tx.ml_score} size="sm" />
                  </td>
                  <td>
                    <StatusBadge decision={tx.final_decision} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          ← Newer
        </button>
        <span className="pagination-info">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || data.length < PAGE_SIZE}
        >
          Older →
        </button>
      </div>
    </div>
  )
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}