// src/lib/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around fetch(). Every page imports `api` instead of calling
// fetch directly — this is where auth headers, error handling, and the base
// URL live, in one place, so no page has to repeat that logic.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function getToken() {
  return localStorage.getItem('fraud_watch_token')
}

async function request(path, options = {}) {
  const token = getToken()

  const headers = {
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token missing/expired/invalid — clear it and force a fresh login.
    localStorage.removeItem('fraud_watch_token')
    throw new ApiError('Session expired. Please log in again.', 401)
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiError(detail, response.status)
  }

  // 204 No Content etc. — nothing to parse
  if (response.status === 204) return null

  return response.json()
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  async login(username, password) {
    // The backend's /auth/login expects OAuth2 form data, not JSON —
    // this matches FastAPI's OAuth2PasswordRequestForm on the server side.
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })

    if (!response.ok) {
      let detail = 'Incorrect username or password'
      try {
        const body = await response.json()
        detail = body.detail || detail
      } catch {
        /* keep default */
      }
      throw new ApiError(detail, response.status)
    }

    const data = await response.json()
    localStorage.setItem('fraud_watch_token', data.access_token)
    return data
  },

  logout() {
    localStorage.removeItem('fraud_watch_token')
  },

  isAuthenticated() {
    return Boolean(getToken())
  },
}

export { ApiError }