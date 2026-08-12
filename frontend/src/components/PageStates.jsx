// src/components/PageStates.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Three small components every data-driven page needs. Kept together since
// they're always used as a trio (loading → error OR empty → real content).
// ─────────────────────────────────────────────────────────────────────────────

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state-block state-loading">
      <span className="state-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="state-block state-error">
      <strong>Couldn't load this.</strong>
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="state-block state-empty">
      <span>{message}</span>
    </div>
  )
}