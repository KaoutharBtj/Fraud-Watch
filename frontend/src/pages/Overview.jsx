// src/pages/Overview.jsx
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState } from '../components/PageStates'
import StatCard from '../components/StatCard'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import TrendChart from '../components/charts/TrendChart'
import AnomalyScatter from '../components/charts/AnomalyScatter'

export default function Overview() {
  const { data, loading, error } = useApi('/stats', [], { pollMs: 8000 })
  const { data: distribution } = useApi('/stats/distribution', [], { pollMs: 8000 })
  const { data: trend } = useApi('/stats/trend?days=7', [], { pollMs: 30000 })
  const { data: recentTx } = useApi('/transactions/recent?limit=100&offset=0', [], {
    pollMs: 8000,
  })

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

      <div className="chart-grid">
        <div className="detail-card">
          <h3>Risk distribution</h3>
          {distribution ? (
            <RiskDistributionChart data={distribution} />
          ) : (
            <Loading label="Loading…" />
          )}
        </div>

        <div className="detail-card">
          <h3>Decision trend — last 7 days</h3>
          {trend ? <TrendChart data={trend} /> : <Loading label="Loading…" />}
        </div>
      </div>

      <div className="detail-card" style={{ marginTop: 16 }}>
        <h3>Anomaly explorer</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Amount ratio vs. risk score for the last 100 transactions — low ratios
          clustering with high scores are the card-testing pattern the detector
          watches for.
        </p>
        {recentTx ? (
          <AnomalyScatter transactions={recentTx} />
        ) : (
          <Loading label="Loading…" />
        )}
      </div>

      <style>{`
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-top: var(--space-5);
        }
        @media (max-width: 900px) {
          .chart-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}