// src/pages/Transactions.jsx
import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Loading, ErrorState, EmptyState } from '../components/PageStates'
import StatusBadge from '../components/StatusBadge'
import RiskMeter from '../components/RiskMeter'

const PAGE_SIZE = 20

const EMPTY_FILTERS = {
  customerId: '',
  minAmount: '',
  maxAmount: '',
  country: '',
  device: '',
  minRisk: '',
  maxRisk: '',
  dateFrom: '',
  dateTo: '',
}

// Turns the filter state into a query string, skipping empty fields —
// so filters the analyst hasn't touched are simply omitted from the
// request instead of being sent as empty strings.
function buildQuery(filters, limit, offset) {
  const params = new URLSearchParams()
  params.set('limit', limit)
  params.set('offset', offset)

  if (filters.customerId !== '') params.set('customer_id', filters.customerId)
  if (filters.minAmount !== '') params.set('min_amount', filters.minAmount)
  if (filters.maxAmount !== '') params.set('max_amount', filters.maxAmount)
  if (filters.country.trim() !== '') params.set('country', filters.country.trim().toUpperCase())
  if (filters.device.trim() !== '') params.set('device', filters.device.trim())
  if (filters.minRisk !== '') params.set('min_risk', filters.minRisk)
  if (filters.maxRisk !== '') params.set('max_risk', filters.maxRisk)
  if (filters.dateFrom !== '') params.set('date_from', new Date(filters.dateFrom).toISOString())
  if (filters.dateTo !== '') params.set('date_to', new Date(filters.dateTo).toISOString())

  return `/transactions/recent?${params.toString()}`
}

function hasActiveFilters(filters) {
  return Object.values(filters).some((v) => v !== '')
}

export default function Transactions() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const debouncedFilters = useDebouncedValue(filters, 400)
  const offset = page * PAGE_SIZE

  const query = useMemo(
    () => buildQuery(debouncedFilters, PAGE_SIZE, offset),
    [debouncedFilters, offset]
  )

  const { data, loading, error } = useApi(query, [query], { pollMs: 8000 })

  function updateFilter(key, value) {
    setPage(0) // any filter change starts back at page 1
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setPage(0)
    setFilters(EMPTY_FILTERS)
  }

  const filtersActive = hasActiveFilters(filters)

  return (
    <div>
      <h3>Recent transactions</h3>

      <div className="filter-bar">
        <div className="filter-field">
          <label>Customer ID</label>
          <input
            type="number"
            placeholder="e.g. 3528"
            value={filters.customerId}
            onChange={(e) => updateFilter('customerId', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Amount</label>
          <div className="filter-range">
            <input
              type="number"
              placeholder="Min"
              value={filters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
            />
            <span>–</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-field">
          <label>Country</label>
          <input
            type="text"
            placeholder="e.g. MA"
            maxLength={5}
            value={filters.country}
            onChange={(e) => updateFilter('country', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Device</label>
          <input
            type="text"
            placeholder="e.g. Android"
            value={filters.device}
            onChange={(e) => updateFilter('device', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>Risk score</label>
          <div className="filter-range">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min"
              value={filters.minRisk}
              onChange={(e) => updateFilter('minRisk', e.target.value)}
            />
            <span>–</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max"
              value={filters.maxRisk}
              onChange={(e) => updateFilter('maxRisk', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-field">
          <label>From</label>
          <input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>To</label>
          <input
            type="datetime-local"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>

        {filtersActive && (
          <button className="filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <div className="data-table-wrap" style={{ marginTop: 16 }}>
        {loading && <Loading label="Loading transactions…" />}
        {error && <ErrorState message={error} />}
        {!loading && !error && data && data.length === 0 && (
          <EmptyState
            message={
              filtersActive
                ? 'No transactions match these filters.'
                : 'No transactions have been processed yet.'
            }
          />
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

      <style>{`
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: var(--space-4);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-top: 16px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-field label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .filter-field input {
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 7px 10px;
          font-size: 13px;
          width: 130px;
        }

        .filter-field input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .filter-range {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-range input {
          width: 68px;
        }

        .filter-range span {
          color: var(--text-muted);
        }

        .filter-clear {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
          height: 34px;
        }

        .filter-clear:hover {
          border-color: var(--risk-block);
          color: var(--risk-block);
        }
      `}</style>
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