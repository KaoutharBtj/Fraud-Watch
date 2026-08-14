// src/hooks/useDebouncedValue.js
// ─────────────────────────────────────────────────────────────────────────────
// Delays updating a value until it stops changing for `delayMs`. Used for
// filter inputs — without this, every keystroke in a text/number filter
// field would trigger its own API request. Waiting ~400ms after the last
// keystroke means one request per "pause", not one per character.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}