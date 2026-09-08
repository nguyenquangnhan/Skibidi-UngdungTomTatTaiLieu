'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Bot, User, Copy, Check, Sparkles, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

function Message({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyText = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? '' : ''
      }`}
        style={{
          background: isUser ? 'var(--primary)' : 'var(--surface-3)',
          border: `1px solid ${isUser ? 'transparent' : 'var(--border)'}`,
        }}>
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} style={{ color: 'var(--primary)' }} />
        }
      </div>

      {/* Content */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser ? 'var(--primary)' : 'var(--surface-3)',
            color: isUser ? 'white' : 'var(--text-bright)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {msg.isStreaming ? (
            <span>
              {msg.content}
              <span className="inline-block w-0.5 h-4 ml-1 align-middle animate-pulse" style={{ background: 'var(--primary)' }} />
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>

        {/* Copy button */}
        {!isUser && !msg.isStreaming && msg.content && (
          <button
            onClick={copyText}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs transition-opacity px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Đã chép' : 'Sao chép'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ notebookId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const { authFetch, token, apiUrl } = useAuth()

  // Load history
  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`/api/notebooks/${notebookId}/chat`)
        const data = await res.json()
        if (res.ok) setMessages(data)
      } catch (e) {}
      setInitialLoading(false)
    }
    load()
  }, [notebookId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])

    // Add streaming AI message placeholder
    const aiMsgId = `ai-${Date.now()}`
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isStreaming: true }])

    try {
      const res = await fetch(`${apiUrl}/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: question }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'token') {
              fullContent += data.content
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullContent } : m
              ))
            } else if (data.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: data.full_content, isStreaming: false } : m
              ))
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: 'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại.', isStreaming: false }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }, [input, loading, notebookId, token, apiUrl])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner text="Đang tải lịch sử chat..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
              <Sparkles size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>
              Bắt đầu hỏi đáp với AI
            </h3>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Upload tài liệu rồi đặt câu hỏi. AI sẽ trả lời dựa trên nội dung tài liệu của bạn.
            </p>
          </div>
        ) : (
          messages.map(msg => <Message key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tài liệu... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={1}
            className="input-field flex-1 resize-none min-h-[42px] max-h-32"
            style={{ lineHeight: '1.5' }}
            disabled={loading}
          />
          <button
            id="chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2.5 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Skibidi · Powered by Gemini 2.5 Flash + GraphRAG
        </p>
      </div>
    </div>
  )
}
