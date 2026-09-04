// src/pages/DashboardLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The persistent app shell: sidebar nav + top bar, with the active page
// rendered via <Outlet /> (react-router's slot for nested routes). Real
// content (recent transactions, stats, etc.) gets built into the pages
// this renders next — this file only owns the layout frame.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AgentChatProvider } from '../context/AgentChatContext'
import { useTransactionAlerts } from '../hooks/useTransactionAlerts'
import AlertToast from '../components/AlertToast'
import {
  IconGrid,
  IconList,
  IconShieldCheck,
  IconBot,
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
} from '../components/Icons'
import appLogo from '../assets/appLogo.png'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true, icon: IconGrid },
  { to: '/transactions', label: 'Transactions', icon: IconList },
  { to: '/decisions', label: 'Decisions', icon: IconShieldCheck },
  { to: '/agent', label: 'AI Agent', icon: IconBot },
]

// Sidebar collapsed/expanded state is remembered across page loads via
// localStorage, same pattern as the auth token — read once at module init
// so the very first render already has the right width (no flash/jump).
const SIDEBAR_KEY = 'fraud_watch_sidebar_collapsed'

function getInitialCollapsed() {
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

export default function DashboardLayout() {
  const { logout } = useAuth()
  const { alerts, dismissAlert, muted, toggleMuted } = useTransactionAlerts()
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  return (
    <div className={`shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src={appLogo} alt="Fraud Watch logo" className="brand-logo" />
          {!collapsed && <span>Fraud Watch</span>}
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="nav-icon" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          {!collapsed && <span>Collapse</span>}
        </button>

        <button className="logout" onClick={logout} title={collapsed ? 'Sign out' : undefined}>
          <IconLogout className="nav-icon" />
          {!collapsed && <span>Sign out</span>}
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
          <AgentChatProvider>
            <Outlet />
          </AgentChatProvider>
        </main>
      </div>

      <AlertToast alerts={alerts} onDismiss={dismissAlert} />

      <style>{`
        .shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
          transition: grid-template-columns 0.18s ease;
        }

        .shell.sidebar-collapsed {
          grid-template-columns: 68px 1fr;
        }

        .sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: var(--space-5) var(--space-3);
          overflow: hidden;
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
          white-space: nowrap;
        }

        .brand-logo {
          width: 26px;
          height: 26px;
          object-fit: contain;
          flex-shrink: 0;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          padding: 9px var(--space-3);
          border-radius: var(--radius-sm);
          white-space: nowrap;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .sidebar-collapsed .nav-item {
          justify-content: center;
          padding: 9px;
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

        .sidebar-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 8px var(--space-3);
          font-size: 13px;
          cursor: pointer;
          margin-bottom: var(--space-2);
          white-space: nowrap;
        }

        .sidebar-collapsed .sidebar-toggle {
          justify-content: center;
          padding: 8px;
        }

        .sidebar-toggle:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .logout {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 8px var(--space-3);
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .sidebar-collapsed .logout {
          justify-content: center;
          padding: 8px;
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
          .shell,
          .shell.sidebar-collapsed {
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
          .sidebar-toggle { display: none; }
        }
      `}</style>
    </div>
  )
}