// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import appLogo from '../assets/appLogo.png'
import backgroundLogin from '../assets/backroundLogin.png'

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
    <div
      className="login-screen"
      style={{ backgroundImage: `url(${backgroundLogin})` }}
    >
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          <img src={appLogo} alt="Fraud Watch logo" className="login-logo" />
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
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: var(--space-4);
        }

        .login-card {
          width: 100%;
          max-width: 360px;
          background: rgba(20, 16, 12, 0.45);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
          padding: var(--space-6) var(--space-5);
          text-align: center;
        }

        .login-mark {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-4);
        }

        .login-logo {
          width: 56px;
          height: 56px;
          object-fit: contain;
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
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.16);
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