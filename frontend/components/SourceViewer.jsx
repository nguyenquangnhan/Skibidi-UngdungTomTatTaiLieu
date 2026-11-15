'use client'
import { useState, useEffect } from 'react'
import { X, ExternalLink, FileText, Globe, Image as ImageIcon, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function SourceViewer({ source, onClose }) {
  const { authFetch } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    if (!source?.id || !source?.notebook_id) return
    let cancelled = false
    setLoadingSummary(true)
    setSummary(null)

    authFetch(`/api/notebooks/${source.notebook_id}/sources/${source.id}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSummary(false)
      })

    return () => {
      cancelled = true
    }
  }, [source?.id, source?.notebook_id, authFetch])

  if (!source) return null

  const typeConfig = {
    pdf: { icon: FileText, label: 'Tệp Tài liệu', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' },
    image: { icon: ImageIcon, label: 'Hình ảnh (OCR)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    url: { icon: Globe, label: 'Trang Web', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  }
  const config = typeConfig[source.source_type] || typeConfig.url
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#090a0f]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#12151e] border border-white/[0.1] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: config.bg, border: `1px solid ${config.color}30` }}
          >
            <Icon size={18} style={{ color: config.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-white truncate">
              {source.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-medium">{config.label}</span>
              {source.chunk_count > 0 && (
                <span className="text-xs text-slate-400">· {source.chunk_count} đoạn văn bản</span>
              )}
            </div>
          </div>

          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Mở liên kết gốc"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* Multi-layer AI Summary Section */}
          <div className="rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Tóm tắt Đa tầng (TL;DR & Điểm cốt lõi)</span>
            </div>

            {loadingSummary ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                <span>Đang tổng hợp bản tóm tắt đa tầng từ tài liệu...</span>
              </div>
            ) : summary ? (
              <div className="space-y-3 text-xs text-slate-200 leading-relaxed">
                <p className="text-slate-100 font-medium bg-white/[0.03] p-3 rounded-lg border border-white/[0.06]">
                  {summary.summary_tldr}
                </p>
                {Array.isArray(summary.key_points) && summary.key_points.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Luận điểm chính:</div>
                    <ul className="space-y-1.5">
                      {summary.key_points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Tài liệu đã được trích xuất và chia nhỏ kèm đánh dấu [Trang N] để phục vụ GraphRAG.
              </p>
            )}
          </div>

          {source.source_type === 'pdf' ? (
            <div className="text-center py-4">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notebooks/${source.notebook_id}/sources/${source.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex text-xs px-5 py-2.5"
              >
                <ExternalLink size={14} />
                <span>Xem tệp gốc ({source.title})</span>
              </a>
            </div>
          ) : source.source_type === 'url' ? (
            <div className="text-center py-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 break-all px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]"
              >
                <span>{source.url}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          ) : null}

          {source.error_message && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
              <strong className="block mb-1">Chi tiết lỗi xử lý:</strong>
              {source.error_message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
