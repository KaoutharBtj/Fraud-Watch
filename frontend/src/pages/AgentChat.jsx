// src/pages/AgentChat.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Ask Fraud Watch" — chat UI for the text-to-SQL analyst assistant
// (backend: POST /agent/chat → chat_agent.chat()). The analyst asks a
// natural-language question and gets an answer generated from a real,
// read-only SQL query against the fraud_decisions / customers tables.
//
// The right-hand "Context" panel is static for now — a visual placeholder
// matching the design reference. It isn't wired to a specific transaction
// yet; that would need the chat to be linked to a case/transaction id.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { IconBot, IconSend, IconPlus, IconStop } from '../components/Icons'
import { useAgentChat } from '../context/AgentChatContext'

const SUGGESTIONS = [
  'How many transactions were blocked today?',
  'Which customer had the highest risk score?',
  'Show me the last 5 blocked transactions',
]

function ChatBubble({ role, content, pending }) {
  const isUser = role === 'user'
  return (
    <div className={`chat-bubble-row${isUser ? ' chat-bubble-row--user' : ''}`}>
      {!isUser && (
        <div className="chat-avatar" aria-hidden="true">
          <IconBot />
        </div>
      )}
      <div className={`chat-bubble${isUser ? ' chat-bubble--user' : ''}${pending ? ' chat-bubble--pending' : ''}`}>
        {pending ? (
          <span className="chat-typing">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  )
}

export default function AgentChat() {
  const { messages, sending, sendQuestion, cancelQuestion, newChat } = useAgentChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    sendQuestion(input)
    setInput('')
  }

  return (
    <div className="agent-page">
      <div className="agent-chat-col">
        <div className="agent-header">
          <div>
            <h3>
              AI Fraud Analyst <span className="agent-online">● Online</span>
            </h3>
            <p className="agent-subtitle">Your partner for fraud investigation and data insights.</p>
          </div>
          <button className="agent-new-chat" onClick={newChat}>
            <IconPlus />
            New Chat
          </button>
        </div>

        <div className="agent-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="agent-empty">
              <div className="chat-avatar chat-avatar--lg" aria-hidden="true">
                <IconBot />
              </div>
              <p>Ask me anything about transactions, customers, or fraud decisions.</p>
              <div className="agent-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="agent-suggestion-chip" onClick={() => sendQuestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {sending && <ChatBubble role="agent" pending />}
        </div>

        <form className="agent-input-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask anything about transactions, customers, alerts…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          {sending ? (
            <button
              type="button"
              className="agent-send-btn agent-stop-btn"
              onClick={cancelQuestion}
              aria-label="Stop"
              title="Stop"
            >
              <IconStop />
            </button>
          ) : (
            <button
              type="submit"
              className="agent-send-btn"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <IconSend />
            </button>
          )}
        </form>
      </div>

      <aside className="agent-context-col">
        <div className="detail-card">
          <h4>Context</h4>
          <p className="agent-context-hint">
            Ask about a specific transaction or customer and relevant details will show up here.
          </p>
        </div>

        <div className="detail-card">
          <h4>Quick Actions</h4>
          <div className="agent-quick-actions">
            <button onClick={() => sendQuestion('How many transactions were blocked today?')}>
              Blocked today
            </button>
            <button onClick={() => sendQuestion('Which customer had the highest risk score?')}>
              Highest risk customer
            </button>
            <button onClick={() => sendQuestion('What was the average ml_score for BLOCK decisions?')}>
              Avg. block score
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .agent-page {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: var(--space-5);
          height: calc(100vh - 140px);
        }

        @media (max-width: 900px) {
          .agent-page {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .agent-chat-col {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          min-height: 0;
        }

        .agent-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--border);
        }

        .agent-header h3 {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin: 0;
        }

        .agent-online {
          font-size: 11px;
          font-weight: 600;
          color: var(--risk-approve);
        }

        .agent-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .agent-new-chat {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent);
          color: var(--bg);
          border: none;
          border-radius: var(--radius-sm);
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .agent-new-chat:hover {
          background: var(--accent-hover);
        }

        .agent-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .agent-empty {
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          text-align: center;
          color: var(--text-secondary);
          max-width: 360px;
        }

        .agent-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          justify-content: center;
        }

        .agent-suggestion-chip {
          background: var(--surface-raised);
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
        }

        .agent-suggestion-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .chat-bubble-row {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .chat-bubble-row--user {
          flex-direction: row-reverse;
        }

        .chat-avatar {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-muted);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-avatar--lg {
          width: 48px;
          height: 48px;
        }

        .chat-bubble {
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          max-width: 70%;
          font-size: 14px;
          line-height: 1.5;
        }

        .chat-bubble p {
          margin: 0;
          white-space: pre-wrap;
        }

        .chat-bubble--user {
          background: var(--accent-muted);
          border-color: var(--accent);
          color: var(--text-primary);
        }

        .chat-bubble--pending {
          padding: var(--space-3) var(--space-4);
        }

        .chat-typing {
          display: inline-flex;
          gap: 4px;
        }

        .chat-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: chat-typing-bounce 1.1s infinite ease-in-out;
        }

        .chat-typing span:nth-child(2) { animation-delay: 0.15s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes chat-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .agent-input-bar {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--border);
        }

        .agent-input-bar input {
          flex: 1;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 10px 14px;
          font-size: 14px;
        }

        .agent-input-bar input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .agent-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: var(--bg);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .agent-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .agent-send-btn:not(:disabled):hover {
          background: var(--accent-hover);
        }

        .agent-stop-btn {
          background: var(--risk-block);
          color: #fff;
        }

        .agent-stop-btn:hover {
          background: var(--risk-block);
          opacity: 0.85;
        }

        .agent-context-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .agent-context-col h4 {
          margin: 0 0 var(--space-2);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }

        .agent-context-hint {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
        }

        .agent-quick-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .agent-quick-actions button {
          text-align: left;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
        }

        .agent-quick-actions button:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </div>
  )
}