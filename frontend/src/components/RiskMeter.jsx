// src/components/RiskMeter.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The app's signature visual motif: a three-zone gauge (approve/review/block)
// with a marker at the transaction's actual ml_score. Used small in table
// rows, full-size on the transaction detail page — same component, one prop
// controls scale, so the visual language stays consistent everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export default function RiskMeter({ score, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, score))
  const zone = pct >= 80 ? 'block' : pct >= 40 ? 'review' : 'approve'

  return (
    <div className={`risk-meter risk-meter--${size}`}>
      <div className="risk-meter-track">
        <span className="risk-meter-zone risk-meter-zone--approve" />
        <span className="risk-meter-zone risk-meter-zone--review" />
        <span className="risk-meter-zone risk-meter-zone--block" />
        <span
          className={`risk-meter-marker risk-meter-marker--${zone}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      {size !== 'sm' && (
        <div className="risk-meter-value mono">
          <span className={`risk-meter-score risk-meter-score--${zone}`}>
            {pct.toFixed(1)}
          </span>
          <span className="risk-meter-max">/100</span>
        </div>
      )}
    </div>
  )
}