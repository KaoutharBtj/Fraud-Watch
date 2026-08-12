// src/pages/Customer.jsx
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Loading, ErrorState } from '../components/PageStates'

export default function Customer() {
  const { customerId } = useParams()
  const { data: customer, loading, error } = useApi(`/customers/${customerId}`, [customerId])

  return (
    <div>
      <Link to="/transactions" className="back-link">
        ← Back to transactions
      </Link>

      {loading && <Loading label="Loading customer…" />}
      {error && <ErrorState message={error} />}

      {customer && (
        <>
          <h3 className="mono" style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>
            Customer #{customer.customer_id}
          </h3>

          <div className="detail-card" style={{ maxWidth: 420 }}>
            <Field label="Average transaction amount" value={`$${customer.avg_amount.toFixed(2)}`} mono />
            <Field label="Usual country" value={customer.usual_country} />
            <Field label="Usual device" value={customer.usual_device} />
            <Field
              label="Active hours"
              value={`${customer.active_start}:00 – ${customer.active_end}:00`}
              mono
            />
          </div>
        </>
      )}
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