'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BookOpen, Plus, Trash2, LogOut, User, MessageSquare,
  FileText, Network, ChevronLeft, Sparkles, Menu, X,
  Search, ExternalLink, Shield, Cpu, ArrowRight, Layers, CheckCircle2
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
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'graph' | 'sources'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(true)

  // Data
  const [notebooks, setNotebooks] = useState([])
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [sources, setSources] = useState([])
  const [selectedSource, setSelectedSource] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    } catch (e) {
    } finally {
      setNotebooksLoading(false)
    }
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
    setActiveTab('chat')
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
    if (!confirm('Bạn có chắc chắn muốn xóa notebook này cùng toàn bộ tài liệu và đồ thị?')) return
    await authFetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' })
    setNotebooks(prev => prev.filter(n => n.id !== notebookId))
    if (selectedNotebook?.id === notebookId) {
      setView('home')
      setSelectedNotebook(null)
    }
  }, [authFetch, selectedNotebook])

  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) return notebooks
    return notebooks.filter(nb =>
      nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [notebooks, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <LoadingSpinner size="lg" text="Đang khởi động Skibidi..." />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LANDING PAGE (CHƯA ĐĂNG NHẬP) - Linear & Raycast Inspired High-Craft
  // ─────────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">
        {/* Ambient Glow Orbs */}
        <div className="ambient-orb-1 -top-40 -left-40" />
        <div className="ambient-orb-2 top-1/4 -right-40" />

        {/* Navigation Header */}
        <header className="relative z-20 border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] border border-white/20">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              Skibidi
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v0.2.0
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary text-xs px-4 py-2"
            >
              Đăng nhập / Bắt đầu
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_24px_-4px_rgba(99,102,241,0.4)]">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Google Gemini 2.5 Flash + GraphRAG + PP-OCRv6</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-[1.15] max-w-4xl">
            Hỏi Đáp & Trích Xuất Tài Liệu{' '}
            <span className="text-gradient-primary block sm:inline">
              Đột Phá Với GraphRAG
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Không chỉ vector search thông thường — Skibidi xây dựng <strong>Knowledge Graph 2D</strong> từ PDF scan, hình ảnh và URL web. Thấu hiểu mối quan hệ sâu sắc giữa các thực thể và trả lời tức thì qua luồng SSE.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              id="hero-get-started"
              onClick={() => setShowAuthModal(true)}
              className="btn-primary text-sm px-8 py-3.5 shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)] flex items-center gap-2 group"
            >
              <span>Trải nghiệm ngay</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mock Interactive Window */}
          <div className="w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#12151e]/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden text-left mb-16">
            <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">skibidi-workspace / GraphRAG-Overview</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Graph Traversal: Active
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Context Enrichment</span>
                <h3 className="text-lg font-bold text-white">Knowledge Graph + Vector Embeddings</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Khi người dùng đặt câu hỏi, hệ thống kích hoạt đồng thời <strong>Vector Search (Top-5 Chunks)</strong> và <strong>Duyệt đồ thị tri thức</strong> trên Neo4j để khai phá toàn diện các liên kết giữa thực thể.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Person: Nguyễn Văn A</span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Org: Viện Nghiên Cứu</span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20">Rel: TÁC_GIẢ_CỦA</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#181c28] p-4 text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-white/[0.06]">
                  <span>Gemini 2.5 Flash Response</span>
                  <span className="text-indigo-400">Streaming SSE...</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  "Dựa trên tài liệu đã cung cấp, <strong>PP-OCRv6</strong> là động cơ trích xuất văn bản từ PDF scan với tốc độ nhanh hơn 5.2× nhờ backend OpenVINO, phối hợp trực tiếp cùng <strong>Gemini 2.5 Flash</strong> để tóm tắt chính xác."
                </p>
                <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">Nguồn: Chapter3.pdf (Trang 12)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Feature Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
            {[
              {
                icon: Network,
                title: 'GraphRAG Toàn Diện',
                desc: 'Không chỉ vector cosine thông thường, hệ thống duyệt đồ thị tri thức Neo4j hiểu sâu quan hệ giữa các thực thể.',
                color: '#818cf8',
              },
              {
                icon: FileText,
                title: 'PP-OCRv6 Đa Ngôn Ngữ',
                desc: 'Động cơ OCR 2026 nhanh gấp 5.2 lần, nhận diện tiếng Việt cực chuẩn, xử lý mượt mà cả PDF scan và ảnh mờ.',
                color: '#34d399',
              },
              {
                icon: MessageSquare,
                title: 'Streaming SSE Tức Thì',
                desc: 'Phản hồi từng token theo thời gian thực dưới 3 giây, kèm danh sách đoạn trích dẫn nguồn có thể mở xem trực tiếp.',
                color: '#fbbf24',
              },
              {
                icon: Shield,
                title: 'Cục Bộ & Riêng Tư',
                desc: 'PostgreSQL + Neo4j chạy nội bộ qua Docker Compose, không lo phụ thuộc chi phí cloud đắt đỏ.',
                color: '#38bdf8',
              },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <div
                key={idx}
                className="card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="font-semibold text-sm text-white mb-2">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.06] py-6 px-6 text-center text-xs text-slate-400">
          <p>Skibidi — Đề tài Chuyên đề N4 · Phát triển với Next.js 15, FastAPI, Neo4j & Google Gemini AI</p>
        </footer>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN APP VIEW (KHI ĐÃ ĐĂNG NHẬP)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#090a0f] text-slate-200">
      {/* Primary Sidebar */}
      <aside
        className={`flex flex-col border-r border-white/[0.08] bg-[#10131c] transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Skibidi</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">GraphRAG Studio</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Create Notebook CTA */}
        <div className="p-3">
          {creatingNotebook ? (
            <form onSubmit={createNotebook} className="space-y-2">
              <input
                id="new-notebook-input"
                autoFocus
                value={newNotebookTitle}
                onChange={e => setNewNotebookTitle(e.target.value)}
                placeholder="Tên notebook mới..."
                className="input-field text-xs py-2"
              />
              <div className="flex gap-1.5">
                <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">Tạo</button>
                <button
                  type="button"
                  onClick={() => setCreatingNotebook(false)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <button
              id="new-notebook-btn"
              onClick={() => setCreatingNotebook(true)}
              className="w-full btn-primary text-xs py-2 justify-center"
            >
              <Plus size={14} />
              <span>Tạo Notebook mới</span>
            </button>
          )}
        </div>

        {/* Notebooks List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Danh sách Notebooks ({notebooks.length})
          </div>

          {notebooksLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner size="sm" /></div>
          ) : notebooks.length === 0 ? (
            <p className="text-xs text-center py-8 text-slate-400">Chưa có notebook nào</p>
          ) : (
            notebooks.map(nb => {
              const isSelected = selectedNotebook?.id === nb.id && view === 'notebook'
              return (
                <div
                  key={nb.id}
                  id={`notebook-${nb.id}`}
                  onClick={() => openNotebook(nb)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs border ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-400'} />
                    <span className="truncate font-medium">{nb.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                      {nb.source_count || 0}
                    </span>
                    <button
                      onClick={(e) => deleteNotebook(nb.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 text-slate-400 transition-opacity"
                      title="Xóa notebook"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0c0e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex-shrink-0">
              <User size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              id="logout-btn"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#090a0f]">
        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.08] bg-[#10131c]/80 backdrop-blur-xl px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-ghost p-2 rounded-lg text-slate-300 hover:text-white"
                title="Mở thanh bên"
              >
                <Menu size={16} />
              </button>
            )}

            {view === 'notebook' && selectedNotebook ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setView('home')}
                  className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                >
                  <ChevronLeft size={16} />
                  <span>Tất cả</span>
                </button>
                <span className="text-slate-400">/</span>
                <h2 className="font-semibold text-sm text-white truncate max-w-xs md:max-w-md">
                  {selectedNotebook.title}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {sources.length} tài liệu
                </span>
              </div>
            ) : (
              <h2 className="font-semibold text-sm text-white">Bảng điều khiển Notebooks</h2>
            )}
          </div>

          {/* Tab Switcher (When in Notebook View) */}
          {view === 'notebook' && selectedNotebook && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181c28] border border-white/[0.08]">
              {[
                { key: 'chat', label: 'Hội thoại RAG', icon: MessageSquare },
                { key: 'graph', label: 'Đồ thị tri thức', icon: Network },
                { key: 'sources', label: 'Quản lý tài liệu', icon: FileText },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === key
                      ? 'bg-indigo-600 text-white shadow-[0_0_12px_-2px_rgba(99,102,241,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex">
          {view === 'home' ? (
            /* Dashboard View */
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
              {/* Dashboard Banner & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">Không gian nghiên cứu của bạn</h1>
                  <p className="text-xs text-slate-400">Chọn một notebook để bắt đầu hỏi đáp hoặc tạo mới tài liệu nghiên cứu.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm notebook..."
                    className="input-field pl-9 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Notebooks Grid */}
              {filteredNotebooks.length === 0 ? (
                <div className="card p-12 text-center max-w-lg mx-auto mt-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Chưa tìm thấy notebook nào</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Hãy tạo notebook đầu tiên để nạp tài liệu PDF, scan và khởi tạo Knowledge Graph.
                  </p>
                  <button
                    onClick={() => setCreatingNotebook(true)}
                    className="btn-primary text-xs mx-auto"
                  >
                    <Plus size={14} />
                    <span>Tạo notebook ngay</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotebooks.map(nb => (
                    <div
                      key={nb.id}
                      id={`notebook-card-${nb.id}`}
                      onClick={() => openNotebook(nb)}
                      className="card-hover p-5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600/15 border border-indigo-500/30 text-indigo-400">
                            <BookOpen size={18} />
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400">
                            {nb.source_count || 0} tài liệu
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-white mb-1.5 group-hover:text-indigo-400 transition-colors">
                          {nb.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {nb.description || 'Chưa có mô tả. Nhấp để mở không gian làm việc.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06] text-[11px] text-slate-400">
                        <span>GraphRAG Enabled</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => deleteNotebook(nb.id, e)}
                            className="p-1.5 rounded-lg hover:text-red-400 text-slate-400 hover:bg-white/[0.05] transition-colors"
                            title="Xóa notebook"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Notebook Open View: Split Layout */
            <div className="flex-1 flex overflow-hidden">
              {/* Collapsible Left Sources Drawer (In Chat Mode) */}
              {activeTab === 'chat' && sourcesPanelOpen && (
                <div className="w-80 border-r border-white/[0.08] bg-[#0c0e15] flex flex-col overflow-hidden flex-shrink-0">
                  <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText size={14} className="text-indigo-400" />
                      Nguồn tài liệu ({sources.length})
                    </span>
                    <button
                      onClick={() => setSourcesPanelOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                      title="Thu gọn cột nguồn"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
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

                    <div className="pt-2">
                      <DocumentList
                        notebookId={selectedNotebook.id}
                        sources={sources}
                        onSourceDeleted={(id) => setSources(prev => prev.filter(s => s.id !== id))}
                        onSourceClick={(source) => setSelectedSource(source)}
                        onRefresh={() => loadSources(selectedNotebook.id)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Central Dynamic View */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'chat' && (
                  <>
                    {!sourcesPanelOpen && (
                      <button
                        onClick={() => setSourcesPanelOpen(true)}
                        className="absolute top-3 left-3 z-20 btn-secondary text-xs py-1.5 px-2.5 shadow-lg flex items-center gap-1.5"
                      >
                        <FileText size={13} />
                        <span>Nguồn ({sources.length})</span>
                      </button>
                    )}
                    <ChatInterface
                      notebookId={selectedNotebook.id}
                      onSelectSource={(sourceId) => {
                        const found = sources.find(s => s.id === sourceId)
                        if (found) setSelectedSource(found)
                      }}
                    />
                  </>
                )}

                {activeTab === 'graph' && (
                  <KnowledgeGraph notebookId={selectedNotebook.id} />
                )}

                {activeTab === 'sources' && (
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 scrollbar-thin">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Quản lý nguồn tài liệu</h2>
                      <p className="text-xs text-slate-400">Tải lên tài liệu PDF, hình ảnh scan hoặc nhập liên kết web để AI xử lý.</p>
                    </div>

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

                    <div className="border-t border-white/[0.08] pt-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                        Danh sách tài liệu đã xử lý ({sources.length})
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
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Source Viewer Modal */}
      {selectedSource && (
        <SourceViewer source={selectedSource} onClose={() => setSelectedSource(null)} />
      )}
    </div>
  )
}
