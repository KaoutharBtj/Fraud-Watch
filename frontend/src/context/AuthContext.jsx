// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// React Context so any component can ask "is someone logged in?" without
// passing that state down through every layer of props manually.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated())
  const [error, setError] = useState(null)

  const login = useCallback(async (username, password) => {
    setError(null)
    try {
      await api.login(username, password)
      setIsAuthenticated(true)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}