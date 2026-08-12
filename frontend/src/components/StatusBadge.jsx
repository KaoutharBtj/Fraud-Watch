// src/components/StatusBadge.jsx

const STYLES = {
  BLOCK: { color: 'var(--risk-block)', bg: 'var(--risk-block-bg)' },
  REVIEW: { color: 'var(--risk-review)', bg: 'var(--risk-review-bg)' },
  APPROVE: { color: 'var(--risk-approve)', bg: 'var(--risk-approve-bg)' },
}

export default function StatusBadge({ decision }) {
  const style = STYLES[decision] || STYLES.REVIEW
  return (
    <span
      className="status-badge"
      style={{ color: style.color, background: style.bg }}
    >
      {decision}
    </span>
  )
}