// src/pages/DashboardLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The persistent app shell: sidebar nav + top bar, with the active page
// rendered via <Outlet /> (react-router's slot for nested routes). Real
// content (recent transactions, stats, etc.) gets built into the pages
// this renders next — this file only owns the layout frame.
// ─────────────────────────────────────────────────────────────────────────────

import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTransactionAlerts } from '../hooks/useTransactionAlerts'
import AlertToast from '../components/AlertToast'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/transactions', label: 'Transactions' },
  { to: '/decisions', label: 'Decisions' },
]

export default function DashboardLayout() {
  const { logout } = useAuth()
  const { alerts, dismissAlert, muted, toggleMuted } = useTransactionAlerts()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Fraud Watch</span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          Sign out
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>Analyst Dashboard</h2>
          <button
            className={`mute-toggle${muted ? ' muted' : ''}`}
            onClick={toggleMuted}
            title={muted ? 'Voice alerts off' : 'Voice alerts on'}
          >
            {muted ? 'Alerts muted' : 'Alerts on'}
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      <AlertToast alerts={alerts} onDismiss={dismissAlert} />

      <style>{`
        .shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
        }

        .sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: var(--space-5) var(--space-3);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 16px;
          padding: 0 var(--space-2);
          margin-bottom: var(--space-6);
        }

        .brand-mark {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-muted);
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          padding: 9px var(--space-3);
          border-radius: var(--radius-sm);
        }

        .nav-item:hover {
          background: var(--surface-raised);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--accent-muted);
          color: var(--accent);
          font-weight: 500;
        }

        .logout {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 8px;
          font-size: 13px;
          cursor: pointer;
        }

        .logout:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .main {
          display: flex;
          flex-direction: column;
        }

        .topbar {
          border-bottom: 1px solid var(--border);
          padding: var(--space-4) var(--space-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mute-toggle {
          background: var(--surface-raised);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: 999px;
          font-size: 12px;
          padding: 6px 12px;
          cursor: pointer;
        }

        .mute-toggle:not(.muted) {
          border-color: var(--accent);
          color: var(--accent);
        }

        .content {
          padding: var(--space-6);
          flex: 1;
        }

        @media (max-width: 720px) {
          .shell {
            grid-template-columns: 1fr;
          }
          .sidebar {
            flex-direction: row;
            align-items: center;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .brand { margin-bottom: 0; }
          nav { flex-direction: row; }
        }
      `}</style>
    </div>
  )
}