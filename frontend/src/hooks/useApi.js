// src/hooks/useApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Every page needs the same three states: loading, error, data. Instead of
// writing that boilerplate 5 times, pages just call useApi(path) and get all
// three back. Re-fetches whenever `deps` changes (e.g. a page number or a
// filter), same rule as useEffect's dependency array.
//
// Optional third argument: { pollMs } — if set, re-fetches on that interval
// automatically, so a page stays live without the user refreshing the
// browser. Only the FIRST fetch shows the loading spinner; background
// refreshes update data silently, avoiding a flicker every few seconds.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

export function useApi(path, deps = [], options = {}) {
  const { pollMs } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false
    hasLoadedOnce.current = false

    function fetchData() {
      if (!hasLoadedOnce.current) {
        setLoading(true)
        setError(null)
      }

      api
        .get(path)
        .then((result) => {
          if (cancelled) return
          setData(result)
          setError(null)
        })
        .catch((err) => {
          if (cancelled) return
          // Don't blank out already-visible data over a transient poll error —
          // only surface the error if we never successfully loaded anything.
          if (!hasLoadedOnce.current) setError(err.message)
        })
        .finally(() => {
          if (cancelled) return
          setLoading(false)
          hasLoadedOnce.current = true
        })
    }

    fetchData()

    let interval
    if (pollMs) {
      interval = setInterval(fetchData, pollMs)
    }

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pollMs])

  return { data, loading, error }
}