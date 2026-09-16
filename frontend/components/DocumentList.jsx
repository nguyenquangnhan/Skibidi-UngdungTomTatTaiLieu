'use client'
import { useState, useCallback } from 'react'
import {
  FileText, Image, Globe, Trash2, RefreshCw,
  CheckCircle, AlertCircle, Clock, Loader2, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, label: 'Sẵn sàng', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
  processing: { icon: Loader2, label: 'Đang OCR / Xử lý', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  failed: { icon: AlertCircle, label: 'Thất bại', color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
  pending: { icon: Clock, label: 'Chờ xử lý', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' },
}

const TYPE_ICONS = {
  pdf: FileText,
  image: Image,
  url: Globe,
}

export default function DocumentList({ notebookId, sources, onSourceDeleted, onSourceClick, onRefresh }) {
  const { authFetch } = useAuth()
  const [deleting, setDeleting] = useState(null)

  const handleDelete = useCallback(async (sourceId, e) => {
    e.stopPropagation()
    if (!confirm('Xóa tài liệu này khỏi notebook?')) return
    setDeleting(sourceId)
    try {
      await authFetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, { method: 'DELETE' })
      onSourceDeleted?.(sourceId)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }, [authFetch, notebookId, onSourceDeleted])

  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border border-white/[0.06] bg-[#12151e]">
        <FileText size={28} className="mx-auto mb-2 text-slate-400 opacity-40" />
        <p className="text-xs text-slate-400">
          Chưa có tài liệu nào trong notebook này.
        </p>
      </div>
    )
  }

  const anyProcessing = sources.some(s => s.status === 'processing' || s.status === 'pending')

  return (
    <div className="space-y-2">
      {sources.map(source => {
        const TypeIcon = TYPE_ICONS[source.source_type] || FileText
        const statusCfg = STATUS_CONFIG[source.status] || STATUS_CONFIG.pending
        const StatusIcon = statusCfg.icon

        return (
          <div
            key={source.id}
            id={`source-item-${source.id}`}
            onClick={() => onSourceClick?.(source)}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border border-white/[0.06] bg-[#12151e] hover:bg-[#181c28] hover:border-white/[0.12] group"
          >
            {/* File Type Icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.04] border border-white/[0.06] text-indigo-400">
              <TypeIcon size={14} />
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {source.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    border: `1px solid ${statusCfg.border}`,
                  }}
                >
                  <StatusIcon size={9} className={source.status === 'processing' ? 'animate-spin' : ''} />
                  {source.status === 'completed' ? `${source.chunk_count || 0} đoạn` : statusCfg.label}
                </span>
              </div>
            </div>

            {/* Right Action strip */}
            <div className="flex items-center gap-1">
              <button
                id={`source-delete-${source.id}`}
                onClick={(e) => handleDelete(source.id, e)}
                disabled={deleting === source.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/[0.05] transition-all"
                title="Xóa tài liệu"
              >
                {deleting === source.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
              <ChevronRight size={14} className="text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )
      })}

      {anyProcessing && (
        <div className="pt-2 text-center">
          <button
            onClick={onRefresh}
            className="btn-ghost text-[11px] text-indigo-400 hover:text-indigo-300 py-1"
          >
            <RefreshCw size={11} className="animate-spin" />
            <span>Đang làm mới trạng thái xử lý...</span>
          </button>
        </div>
      )}
    </div>
  )
}
