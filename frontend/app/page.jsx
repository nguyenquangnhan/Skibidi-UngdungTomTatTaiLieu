'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Plus, Trash2, LogOut, User, MessageSquare,
  FileText, Network, ChevronLeft, Settings, Sparkles, Menu, X
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'
import ChatInterface from '@/components/ChatInterface'
import DocumentList from '@/components/DocumentList'
import DocumentUpload from '@/components/DocumentUpload'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import SourceViewer from '@/components/SourceViewer'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const { user, loading, logout, authFetch } = useAuth()

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Navigation
  const [view, setView] = useState('home') // 'home' | 'notebook'
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'sources' | 'graph'
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data
  const [notebooks, setNotebooks] = useState([])
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [sources, setSources] = useState([])
  const [selectedSource, setSelectedSource] = useState(null)

  // UI state
  const [creatingNotebook, setCreatingNotebook] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')
  const [notebooksLoading, setNotebooksLoading] = useState(false)

  // Load notebooks
  const loadNotebooks = useCallback(async () => {
    if (!user) return
    setNotebooksLoading(true)
    try {
      const res = await authFetch('/api/notebooks')
      const data = await res.json()
      if (res.ok) setNotebooks(data)
    } catch (e) {}
    setNotebooksLoading(false)
  }, [user, authFetch])

  useEffect(() => {
    loadNotebooks()
  }, [loadNotebooks])

  // Load sources for selected notebook
  const loadSources = useCallback(async (notebookId) => {
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/sources`)
      const data = await res.json()
      if (res.ok) setSources(data)
    } catch (e) {}
  }, [authFetch])

  const openNotebook = useCallback((notebook) => {
    setSelectedNotebook(notebook)
    setView('notebook')
    setSources([])
    loadSources(notebook.id)
  }, [loadSources])

  const createNotebook = useCallback(async (e) => {
    e.preventDefault()
    if (!newNotebookTitle.trim()) return
    try {
      const res = await authFetch('/api/notebooks', {
        method: 'POST',
        body: JSON.stringify({ title: newNotebookTitle.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotebooks(prev => [data, ...prev])
        setNewNotebookTitle('')
        setCreatingNotebook(false)
        openNotebook(data)
      }
    } catch (e) {}
  }, [authFetch, newNotebookTitle, openNotebook])

  const deleteNotebook = useCallback(async (notebookId, e) => {
    e.stopPropagation()
    await authFetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' })
    setNotebooks(prev => prev.filter(n => n.id !== notebookId))
    if (selectedNotebook?.id === notebookId) {
      setView('home')
      setSelectedNotebook(null)
    }
  }, [authFetch, selectedNotebook])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" text="DocuGraph RAG" />
      </div>
    )
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        {/* Hero */}
        <div className="text-center max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <Sparkles size={12} />
            Powered by Gemini 2.5 Flash + GraphRAG
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight text-gradient">
            DocuGraph RAG
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
            Hỏi đáp tài liệu thông minh với AI · GraphRAG · Knowledge Graph · OCR đa ngôn ngữ
          </p>
          <button
            id="hero-get-started"
            onClick={() => setShowAuthModal(true)}
            className="btn-primary text-base px-8 py-3 glow-primary"
          >
            <Sparkles size={18} />
            Bắt đầu miễn phí
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {[
            { icon: FileText, title: 'PDF & OCR', desc: 'Hỗ trợ PDF, ảnh scan, URL. PaddleOCR tiếng Việt tự động.' },
            { icon: Network, title: 'Knowledge Graph', desc: 'Trích xuất thực thể & quan hệ. Visualize đồ thị 2D interactive.' },
            { icon: MessageSquare, title: 'RAG Chat', desc: 'Hỏi đáp streaming với Gemini 2.5 Flash dựa trên tài liệu.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5 hover:border-primary-700 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
                <Icon size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold mb-1.5 text-sm" style={{ color: 'var(--text-bright)' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    )
  }

  // ── Logged in — Main App ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
            <BookOpen size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-bright)' }}>
            DocuGraph RAG
          </span>
        </div>

        {/* New notebook */}
        <div className="p-3">
          {creatingNotebook ? (
            <form onSubmit={createNotebook} className="flex gap-2">
              <input
                id="new-notebook-input"
                autoFocus
                value={newNotebookTitle}
                onChange={e => setNewNotebookTitle(e.target.value)}
                placeholder="Tên notebook..."
                className="input-field flex-1 text-xs py-2"
              />
              <button type="submit" className="btn-primary px-2 py-1.5 text-xs">OK</button>
              <button type="button" onClick={() => setCreatingNotebook(false)} className="btn-ghost px-2 py-1.5 text-xs">
                <X size={12} />
              </button>
            </form>
          ) : (
            <button
              id="new-notebook-btn"
              onClick={() => setCreatingNotebook(true)}
              className="w-full btn-ghost text-xs justify-start gap-2 py-2"
            >
              <Plus size={14} />
              Notebook mới
            </button>
          )}
        </div>

        {/* Notebook list */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
          {notebooksLoading ? (
            <div className="py-6 flex justify-center"><LoadingSpinner size="sm" /></div>
          ) : notebooks.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
              Chưa có notebook nào
            </p>
          ) : (
            <div className="space-y-0.5">
              {notebooks.map(nb => (
                <div
                  key={nb.id}
                  id={`notebook-${nb.id}`}
                  onClick={() => openNotebook(nb)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-xs ${
                    selectedNotebook?.id === nb.id ? 'text-white' : ''
                  }`}
                  style={{
                    background: selectedNotebook?.id === nb.id ? 'var(--primary)' : 'transparent',
                    color: selectedNotebook?.id === nb.id ? 'white' : 'var(--text)',
                  }}
                  onMouseEnter={e => {
                    if (selectedNotebook?.id !== nb.id)
                      e.currentTarget.style.background = 'var(--surface-3)'
                  }}
                  onMouseLeave={e => {
                    if (selectedNotebook?.id !== nb.id)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <BookOpen size={13} className="flex-shrink-0" />
                  <span className="flex-1 truncate font-medium">{nb.title}</span>
                  <span className="opacity-60 text-xs">{nb.source_count}</span>
                  <button
                    onClick={(e) => deleteNotebook(nb.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <User size={13} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-bright)' }}>
                {user.full_name || user.email}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
            <button id="logout-btn" onClick={logout} className="btn-ghost p-1.5" title="Đăng xuất">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-ghost p-2">
            <Menu size={16} />
          </button>

          {view === 'notebook' && selectedNotebook ? (
            <>
              <button onClick={() => setView('home')} className="btn-ghost p-2">
                <ChevronLeft size={16} />
              </button>
              <h1 className="font-semibold text-sm truncate flex-1" style={{ color: 'var(--text-bright)' }}>
                {selectedNotebook.title}
              </h1>
              {/* Tabs */}
              <div className="flex gap-1">
                {[
                  { key: 'chat', label: 'Chat', icon: MessageSquare },
                  { key: 'sources', label: 'Tài liệu', icon: FileText },
                  { key: 'graph', label: 'Đồ thị', icon: Network },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === key ? 'text-white' : ''
                    }`}
                    style={activeTab === key ? { background: 'var(--primary)' } : { color: 'var(--text-muted)' }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <h1 className="font-semibold text-sm" style={{ color: 'var(--text-bright)' }}>
              Notebooks của tôi
            </h1>
          )}
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'home' ? (
            /* Home — notebook grid */
            <div className="flex-1 overflow-y-auto p-6">
              {notebooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
                    <BookOpen size={32} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
                    Chưa có notebook nào
                  </h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Tạo notebook đầu tiên để bắt đầu hỏi đáp tài liệu với AI
                  </p>
                  <button
                    id="create-first-notebook"
                    onClick={() => setCreatingNotebook(true)}
                    className="btn-primary"
                  >
                    <Plus size={16} />
                    Tạo notebook đầu tiên
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-bright)' }}>
                    Notebooks của tôi ({notebooks.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notebooks.map(nb => (
                      <div
                        key={nb.id}
                        id={`notebook-card-${nb.id}`}
                        onClick={() => openNotebook(nb)}
                        className="card-hover p-5 group"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                          style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
                          <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h3 className="font-semibold mb-1 text-sm" style={{ color: 'var(--text-bright)' }}>
                          {nb.title}
                        </h3>
                        {nb.description && (
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {nb.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {nb.source_count} tài liệu
                          </span>
                          <button
                            onClick={(e) => deleteNotebook(nb.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:text-red-400 transition-all"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Notebook view */
            <div className="flex-1 overflow-hidden flex">
              {/* Main panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'chat' && (
                  <ChatInterface notebookId={selectedNotebook.id} />
                )}
                {activeTab === 'sources' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <DocumentUpload
                      notebookId={selectedNotebook.id}
                      onSourceAdded={(source) => {
                        setSources(prev => [source, ...prev])
                        setNotebooks(prev => prev.map(n =>
                          n.id === selectedNotebook.id
                            ? { ...n, source_count: (n.source_count || 0) + 1 }
                            : n
                        ))
                      }}
                    />
                    <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-muted)' }}>
                        Tài liệu đã thêm ({sources.length})
                      </h3>
                      <DocumentList
                        notebookId={selectedNotebook.id}
                        sources={sources}
                        onSourceDeleted={(id) => setSources(prev => prev.filter(s => s.id !== id))}
                        onSourceClick={(source) => setSelectedSource(source)}
                        onRefresh={() => loadSources(selectedNotebook.id)}
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'graph' && (
                  <div className="flex-1 flex overflow-hidden">
                    <KnowledgeGraph notebookId={selectedNotebook.id} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Source viewer modal */}
      {selectedSource && (
        <SourceViewer source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}
    </div>
  )
}
