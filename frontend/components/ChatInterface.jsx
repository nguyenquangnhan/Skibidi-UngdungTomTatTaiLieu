'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Bot, User, Copy, Check, Sparkles,
  BookOpen, CornerDownLeft, RefreshCw, FileText
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const QUICK_PROMPTS = [
  'Tóm tắt các luận điểm cốt lõi trong tài liệu này',
  'Liệt kê các thực thể quan trọng nhất và vai trò của chúng',
  'Mối quan hệ chính giữa các khái niệm là gì?',
  'Có những điểm đáng lưu ý nào cần ghi nhớ?'
]

function MessageItem({ msg, onCitationClick }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copyText = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3.5 group ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      {/* Avatar with glow */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            : 'var(--surface-3)',
          border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.15)' : 'var(--border)'}`,
          boxShadow: isUser ? '0 0 16px -2px var(--primary-glow)' : 'none',
        }}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={15} style={{ color: 'var(--primary)' }} />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] md:max-w-[80%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200"
          style={{
            background: isUser ? 'linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)' : 'var(--surface)',
            color: isUser ? '#ffffff' : 'var(--text-bright)',
            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.15)' : 'var(--border)'}`,
            boxShadow: isUser
              ? '0 4px 16px -2px rgba(79, 70, 229, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          {msg.isStreaming ? (
            <div className="whitespace-pre-wrap">
              {msg.content}
              <span
                className="inline-block w-1.5 h-4 ml-1 align-middle rounded-full animate-pulse"
                style={{ background: 'var(--primary)' }}
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          )}

          {/* Citations & Sources Used */}
          {msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
            <div className="mt-3 pt-2.5 border-t flex flex-wrap items-center gap-1.5" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <FileText size={11} /> Nguồn trích dẫn:
              </span>
              {msg.sources.map((srcId, idx) => (
                <span
                  key={idx}
                  onClick={() => onCitationClick && onCitationClick(srcId)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-bright)',
                  }}
                  title="Nhấp để xem chi tiết nguồn"
                >
                  <BookOpen size={10} style={{ color: 'var(--primary)' }} />
                  Đoạn trích #{idx + 1}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Copy Button and Action strip */}
        {!isUser && !msg.isStreaming && msg.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <button
              onClick={copyText}
              className="flex items-center gap-1 text-[11px] py-0.5 px-2 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-bright)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Sao chép nội dung"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ notebookId, onSelectSource }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const { authFetch, token, apiUrl } = useAuth()

  // Load chat history
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await authFetch(`/api/notebooks/${notebookId}/chat`)
        const data = await res.json()
        if (res.ok && isMounted) setMessages(data)
      } catch (e) {
      } finally {
        if (isMounted) setInitialLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [notebookId, authFetch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (customText) => {
    const question = (customText || input).trim()
    if (!question || loading) return

    setInput('')
    setLoading(true)

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])

    const aiMsgId = `ai-${Date.now()}`
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      isStreaming: true
    }])

    try {
      const res = await fetch(`${apiUrl}/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: question }),
      })

      if (!res.ok) {
        throw new Error('Lỗi máy chủ khi xử lý câu hỏi.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let sourceIds = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'sources') {
              sourceIds = data.source_ids || []
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, sources: sourceIds } : m
              ))
            } else if (data.type === 'token') {
              fullContent += data.content
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullContent } : m
              ))
            } else if (data.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? {
                  ...m,
                  content: data.full_content || fullContent,
                  isStreaming: false,
                  sources: sourceIds
                } : m
              ))
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại dịch vụ Backend.', isStreaming: false }
          : m
      ))
    } finally {
      setLoading(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'
      }
    }
  }, [input, loading, notebookId, token, apiUrl])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputResize = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingSpinner text="Đang đồng bộ hội thoại..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] relative overflow-hidden">
      {/* Top subtle fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[var(--bg)] to-transparent pointer-events-none z-10" />

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 0 30px -4px var(--primary-glow)',
              }}
            >
              <Sparkles size={28} style={{ color: 'var(--primary)' }} />
            </div>

            <h3 className="text-xl font-bold mb-2 text-gradient">
              Trợ lý Tài liệu Skibidi
            </h3>
            <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
              Hỏi đáp với mô hình <strong>Gemini 2.5 Flash</strong> kết hợp <strong>GraphRAG</strong> và <strong>PP-OCRv6</strong>. Dưới đây là một số câu hỏi gợi ý:
            </p>

            {/* Quick Prompt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {QUICK_PROMPTS.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(promptText)}
                  className="text-left p-3.5 rounded-xl text-xs transition-all duration-200 group flex items-start gap-2.5"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-active)'
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--surface)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Sparkles size={14} className="mt-0.5 flex-shrink-0 text-indigo-400 group-hover:text-indigo-300" />
                  <span className="leading-snug">{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageItem
              key={msg.id}
              msg={msg}
              onCitationClick={onSelectSource}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:px-8 pb-5 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div
          className="rounded-2xl p-1.5 transition-all duration-200"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-end gap-2 px-2 py-1">
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi về tài liệu của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="w-full bg-transparent resize-none text-sm outline-none placeholder:text-[var(--text-muted)] text-[var(--text-bright)] leading-relaxed max-h-40 min-h-[40px] py-1.5"
              disabled={loading}
            />

            <button
              id="chat-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn-primary p-2.5 rounded-xl flex-shrink-0 transition-transform active:scale-95"
              style={{
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'var(--surface-3)',
                opacity: input.trim() && !loading ? 1 : 0.4,
              }}
              title="Gửi câu hỏi (Enter)"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin text-white" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] mt-2 px-2" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            GraphRAG Engine sẵn sàng
          </span>
          <span>Nhấn <strong>Enter ↵</strong> để gửi</span>
        </div>
      </div>
    </div>
  )
}
