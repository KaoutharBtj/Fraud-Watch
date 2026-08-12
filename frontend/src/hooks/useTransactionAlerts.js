// src/hooks/useTransactionAlerts.js
// ─────────────────────────────────────────────────────────────────────────────
// Polls GET /transactions/recent on an interval. The first fetch just
// records what's already there (no alerts — otherwise loading the page
// would announce every existing transaction). Every fetch after that
// compares against what's been seen, and raises an alert for any NEW
// transaction whose decision is BLOCK or REVIEW.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../lib/api'

const POLL_INTERVAL_MS = 8000
const MUTE_KEY = 'fraud_watch_muted'

// ── Audio: a short synthesized chime, no external file needed ────────────────
// Browsers block audio that fires without any prior user interaction on the
// page. We "unlock" the AudioContext (and speech synthesis) on the very
// first click anywhere on the page — logging in already provides that click.

let audioCtx = null
let audioUnlocked = false

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function unlockAudio() {
  if (audioUnlocked) return
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  audioUnlocked = true
}

function playTone(frequency, duration, delay = 0) {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.001, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(ctx.currentTime + delay)
  oscillator.stop(ctx.currentTime + delay + duration + 0.05)
}

function playChime(decision) {
  if (!window.AudioContext && !window.webkitAudioContext) return
  if (decision === 'BLOCK') {
    // Two short, lower, urgent notes
    playTone(392, 0.16, 0)
    playTone(392, 0.16, 0.22)
  } else {
    // A brighter two-note "ding-dong" for review
    playTone(880, 0.18, 0)
    playTone(1108, 0.22, 0.16)
  }
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel() // don't stack overlapping announcements
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.05
  window.speechSynthesis.speak(utterance)
}


export function useTransactionAlerts() {
  const [alerts, setAlerts] = useState([])
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true')
  const seenIds = useRef(new Set())
  const isFirstFetch = useRef(true)

  // Unlock audio on the first click/keypress anywhere on the page — this
  // covers the login click, so alerts work automatically after that.
  useEffect(() => {
    function handleFirstInteraction() {
      unlockAudio()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      localStorage.setItem(MUTE_KEY, String(next))
      if (next) window.speechSynthesis?.cancel()
      return next
    })
  }, [])

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await api.get('/transactions/recent?limit=10&offset=0')
        if (cancelled || !data) return

        if (isFirstFetch.current) {
          // Just record what's already there — no alerts on initial load.
          data.forEach((tx) => seenIds.current.add(tx.audit_id))
          isFirstFetch.current = false
          return
        }

        const freshFlagged = data.filter(
          (tx) =>
            !seenIds.current.has(tx.audit_id) &&
            (tx.final_decision === 'BLOCK' || tx.final_decision === 'REVIEW')
        )

        data.forEach((tx) => seenIds.current.add(tx.audit_id))

        freshFlagged.forEach((tx) => {
          const alert = {
            id: tx.audit_id,
            decision: tx.final_decision,
            customerId: tx.customer_id,
            amount: tx.amount,
          }
          setAlerts((prev) => [alert, ...prev].slice(0, 5)) // cap visible stack

          if (!muted) {
            playChime(tx.final_decision)
          }
        })
      } catch {
        // Polling failures (e.g. token expired) shouldn't crash the dashboard —
        // just skip this cycle, the next poll will try again.
      }
    }

    poll() // fire immediately, then on the interval
    const interval = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted])

  return { alerts, dismissAlert, muted, toggleMuted }
}