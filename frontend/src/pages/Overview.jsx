// src/pages/Overview.jsx
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState } from '../components/PageStates'
import StatCard from '../components/StatCard'

export default function Overview() {
  const { data, loading, error } = useApi('/stats', [], { pollMs: 8000 })

  if (loading) return <Loading label="Loading stats…" />
  if (error) return <ErrorState message={error} />

  return (
    <div>
      <h3>Overview</h3>
      <div className="stat-grid" style={{ marginTop: 16 }}>
        <StatCard label="Total transactions" value={data.total_transactions} />
        <StatCard
          label="Approved"
          value={data.approved_count}
          sub={`${data.approved_pct}% of total`}
          tone="approve"
        />
        <StatCard
          label="Review"
          value={data.review_count}
          sub={`${data.review_pct}% of total`}
          tone="review"
        />
        <StatCard
          label="Blocked"
          value={data.blocked_count}
          sub={`${data.blocked_pct}% of total`}
          tone="block"
        />
        <StatCard label="Avg risk score" value={data.avg_ml_score} sub="/ 100" />
      </div>
    </div>
  )
}