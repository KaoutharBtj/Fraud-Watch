// src/components/AlertToast.jsx
import { Link } from 'react-router-dom'

export default function AlertToast({ alerts, onDismiss }) {
  if (alerts.length === 0) return null

  return (
    <div className="toast-stack">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          to={`/transactions/${alert.id}`}
          className={`toast toast--${alert.decision.toLowerCase()}`}
        >
          <span className="toast-dot" />
          <div className="toast-body">
            <strong>{alert.decision === 'BLOCK' ? 'Blocked' : 'Review needed'}</strong>
            <span className="mono toast-detail">
              Customer #{alert.customerId} · ${alert.amount.toFixed(2)}
            </span>
          </div>
          <button
            className="toast-dismiss"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDismiss(alert.id)
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </Link>
      ))}
    </div>
  )
}