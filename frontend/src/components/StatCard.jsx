// src/components/StatCard.jsx

export default function StatCard({ label, value, sub, tone }) {
  return (
    <div className={`stat-card${tone ? ` stat-card--${tone}` : ''}`}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value mono">{value}</span>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </div>
  )
}