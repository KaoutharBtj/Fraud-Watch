// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const ok = await login(username, password)
    setSubmitting(false)
    if (ok) navigate('/')
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          <RiskDial />
        </div>

        <h1>Fraud Watch</h1>
        <p className="login-sub">Analyst access only. Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <style>{`
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% -10%, rgba(192,133,82,0.08), transparent 60%),
            var(--bg);
          padding: var(--space-4);
        }

        .login-card {
          width: 100%;
          max-width: 360px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          padding: var(--space-6) var(--space-5);
          text-align: center;
        }

        .login-mark {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-4);
        }

        .login-card h1 {
          margin-bottom: var(--space-1);
        }

        .login-sub {
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: var(--space-5);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          text-align: left;
          gap: var(--space-1);
        }

        .login-form label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: var(--space-3);
        }

        .login-form input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 14px;
          padding: 10px 12px;
        }

        .login-form input:focus-visible {
          border-color: var(--accent);
        }

        .login-error {
          margin-top: var(--space-3);
          font-size: 13px;
          color: var(--risk-block);
        }

        .login-form button {
          margin-top: var(--space-5);
          background: var(--accent);
          color: #14100c;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 14px;
          padding: 11px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .login-form button:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .login-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

// Small inline SVG — the "risk dial" signature motif, used as the mark here
// and reused (scaled) as the real risk meter on transaction screens later.
function RiskDial() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="25" stroke="var(--border-strong)" strokeWidth="2" />
      <path
        d="M28 28 L28 10"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform="rotate(35 28 28)"
      />
      <circle cx="28" cy="28" r="3" fill="var(--accent)" />
      <path
        d="M10 40 A25 25 0 0 1 16 15"
        stroke="var(--risk-approve)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M46 40 A25 25 0 0 0 40 15"
        stroke="var(--risk-block)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}