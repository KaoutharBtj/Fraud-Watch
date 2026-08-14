// src/context/AgentChatContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Chat state (conversation list, active thread, in-flight request) lives
// here instead of inside AgentChat.jsx, for two reasons:
//   1. It must survive navigating to other pages (see the comment on
//      AgentChatProvider's mount point in DashboardLayout.jsx).
//   2. Conversations are now persisted server-side (agent_conversations /
//      agent_messages tables) — this context is the single place that
//      talks to those endpoints, so the page component just renders state.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { api, ApiError } from '../lib/api'

const AgentChatContext = createContext(null)

export function AgentChatProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  // AbortController for the in-flight /agent/chat request, so the stop
  // button can cancel waiting on it (see notes on sendQuestion below).
  const controllerRef = useRef(null)

  const refreshConversations = useCallback(async () => {
    try {
      const list = await api.get('/agent/conversations')
      setConversations(list)
    } catch {
      // Silently ignore — the conversation list is a convenience sidebar,
      // not critical enough to show an error banner over the whole page.
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  // Load the analyst's conversation list once, when they first open a
  // protected page (this provider mounts once per login session).
  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  const openConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId)
    setMessages([])
    try {
      const history = await api.get(`/agent/conversations/${conversationId}/messages`)
      setMessages(history.map((m) => ({ role: m.role, content: m.content })))
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not load this conversation.'
      setMessages([{ role: 'agent', content: msg, isError: true }])
    }
  }, [])

  const sendQuestion = useCallback(
    async (question) => {
      const text = question.trim()
      if (!text) return

      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setSending(true)

      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const res = await api.post(
          '/agent/chat',
          { question: text, conversation_id: activeConversationId },
          { signal: controller.signal }
        )
        setMessages((prev) => [...prev, { role: 'agent', content: res.answer }])
        setActiveConversationId(res.conversation_id)
        refreshConversations() // updates title (if new) and moves it to the top
      } catch (err) {
        if (err.name === 'AbortError') {
          setMessages((prev) => [...prev, { role: 'agent', content: 'Question cancelled.', isCancelled: true }])
        } else {
          const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
          setMessages((prev) => [...prev, { role: 'agent', content: msg, isError: true }])
        }
      } finally {
        setSending(false)
        controllerRef.current = null
      }
    },
    [activeConversationId, refreshConversations]
  )

  const cancelQuestion = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const newChat = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
  }, [])

  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await api.del(`/agent/conversations/${conversationId}`)
      } catch {
        return // leave the list as-is if the delete failed server-side
      }
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (conversationId === activeConversationId) {
        setActiveConversationId(null)
        setMessages([])
      }
    },
    [activeConversationId]
  )

  return (
    <AgentChatContext.Provider
      value={{
        conversations,
        conversationsLoading,
        activeConversationId,
        messages,
        sending,
        sendQuestion,
        cancelQuestion,
        newChat,
        openConversation,
        deleteConversation,
      }}
    >
      {children}
    </AgentChatContext.Provider>
  )
}

export function useAgentChat() {
  const ctx = useContext(AgentChatContext)
  if (!ctx) throw new Error('useAgentChat must be used inside an AgentChatProvider')
  return ctx
}