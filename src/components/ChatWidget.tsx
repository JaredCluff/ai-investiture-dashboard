import { useState, useEffect, useRef, useCallback } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts?: string
}

type Phase = 'loading' | 'register' | 'chat'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('loading')
  const [userName, setUserName] = useState('')

  // Registration form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regError, setRegError] = useState('')
  const [registering, setRegistering] = useState(false)

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState('')

  // Board message modal
  const [boardOpen, setBoardOpen] = useState(false)
  const [boardInput, setBoardInput] = useState('')
  const [boardSending, setBoardSending] = useState(false)
  const [boardSent, setBoardSent] = useState(false)
  const [boardError, setBoardError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initDone = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && !initDone.current) {
      initDone.current = true
      checkSession()
    }
    if (open && phase === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, phase])

  async function checkSession() {
    try {
      const res = await fetch('/chat/history', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const msgs: ChatMessage[] = (data.messages ?? []).map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        }))
        setMessages(msgs)
        setPhase('chat')
      } else {
        setPhase('register')
      }
    } catch {
      setPhase('register')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    const name = regName.trim()
    const email = regEmail.trim()
    if (!name) { setRegError('Name is required.'); return }
    if (!email.includes('@') || !email.split('@')[1]?.includes('.')) {
      setRegError('Enter a valid email address.')
      return
    }
    setRegistering(true)
    try {
      const res = await fetch('/chat/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegError(data.detail ?? 'Registration failed.')
        return
      }
      setUserName(data.name ?? name)
      setMessages([])
      setPhase('chat')
    } catch {
      setRegError('Connection error. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setChatError('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setSending(true)
    try {
      const res = await fetch('/chat/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          setPhase('register')
          initDone.current = false
          return
        }
        setChatError(data.detail ?? 'Error sending message.')
        return
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setChatError('Connection error. Please try again.')
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function handleBoardSend(e: React.FormEvent) {
    e.preventDefault()
    const text = boardInput.trim()
    if (!text || boardSending) return
    setBoardError('')
    setBoardSending(true)
    try {
      const res = await fetch('/chat/board-message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        const data = await res.json()
        setBoardError(data.detail ?? 'Failed to send.')
        return
      }
      setBoardSent(true)
    } catch {
      setBoardError('Connection error. Please try again.')
    } finally {
      setBoardSending(false)
    }
  }

  function openBoard() {
    setBoardInput('')
    setBoardSent(false)
    setBoardError('')
    setBoardOpen(true)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Chat with Spark'}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          open ? 'bg-gray-700 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-400'
        }`}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 flex flex-col bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-100 leading-tight">Spark</p>
              <p className="text-xs text-gray-500 leading-tight">AI-Investiture PR Agent</p>
            </div>
            {phase === 'chat' && (
              <button
                onClick={openBoard}
                className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                title="Leave a message for the board"
              >
                Board msg
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Loading */}
            {phase === 'loading' && (
              <div className="flex items-center justify-center h-32">
                <span className="text-xs text-gray-500 animate-pulse">Connecting…</span>
              </div>
            )}

            {/* Register */}
            {phase === 'register' && (
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-4">
                  Introduce yourself to chat with Spark, AI-Investiture's PR agent.
                </p>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Your name"
                      maxLength={100}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={200}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  {regError && <p className="text-xs text-red-400">{regError}</p>}
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium py-2 rounded transition-colors"
                  >
                    {registering ? 'Starting chat…' : 'Start chatting'}
                  </button>
                </form>
                <p className="text-xs text-gray-600 mt-3">
                  Email is encrypted at rest and used only to maintain your chat session.
                </p>
              </div>
            )}

            {/* Chat messages */}
            {phase === 'chat' && (
              <div className="flex flex-col gap-2 p-3">
                {messages.length === 0 && !sending && (
                  <p className="text-xs text-gray-600 text-center py-4">
                    Ask me anything about AI-Investiture.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-green-700/50 text-gray-100'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 rounded-lg px-3 py-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                {chatError && (
                  <p className="text-xs text-red-400 text-center">{chatError}</p>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {phase === 'chat' && (
            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-700 shrink-0 bg-gray-900">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Spark…"
                maxLength={2000}
                disabled={sending}
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="shrink-0 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}

          {/* Footer branding */}
          <div className="px-3 py-1.5 border-t border-gray-800 bg-gray-900 shrink-0">
            <p className="text-xs text-gray-700 text-center">
              Powered by <span className="text-gray-600">Spark</span> · Not financial advice
            </p>
          </div>
        </div>
      )}

      {/* Board message modal */}
      {boardOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-100">Message the Board</h2>
              <button onClick={() => setBoardOpen(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {boardSent ? (
                <div className="text-center py-4">
                  <p className="text-green-400 text-sm font-medium mb-1">Message received</p>
                  <p className="text-xs text-gray-500">The board will review your message.</p>
                  <button
                    onClick={() => setBoardOpen(false)}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-300"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBoardSend} className="space-y-3">
                  <p className="text-xs text-gray-400">
                    Leave a message for the AI-Investiture board. Keep it brief and respectful.
                  </p>
                  <textarea
                    value={boardInput}
                    onChange={e => setBoardInput(e.target.value)}
                    placeholder="Your message…"
                    maxLength={500}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{boardInput.length}/500</span>
                    {boardError && <p className="text-xs text-red-400">{boardError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={!boardInput.trim() || boardSending}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium py-2 rounded transition-colors"
                  >
                    {boardSending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
