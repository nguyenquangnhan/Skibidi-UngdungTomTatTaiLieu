'use client'
import { useState, useEffect, useCallback } from 'react'
import { FileText, Image, Globe, Trash2, RefreshCw, CheckCircle, AlertCircle, Clock, Loader2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const STATUS_ICONS = {
  completed: CheckCircle,
  processing: Loader2,
  failed: AlertCircle,
  pending: Clock,
}

const TYPE_ICONS = { pdf: FileText, image: Image, url: Globe }

export default function DocumentList({ notebookId, sources, onSourceDeleted, onSourceClick, onRefresh }) {
  const { authFetch } = useAuth()
  const [deleting, setDeleting] = useState(null)

  const handleDelete = useCallback(async (sourceId, e) => {
    e.stopPropagation()
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
      <div className="text-center py-10">
        <FileText size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Chưa có tài liệu nào. Hãy upload PDF hoặc thêm URL!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sources.map(source => {
        const TypeIcon = TYPE_ICONS[source.source_type] || FileText
        const StatusIcon = STATUS_ICONS[source.status] || Clock
        return (
          <div
            key={source.id}
            id={`source-item-${source.id}`}
            onClick={() => onSourceClick?.(source)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group"
            style={{ background: 'var(--surface-3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-3)'}
          >
            {/* Type icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <TypeIcon size={14} style={{ color: 'var(--primary)' }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-bright)' }}>
                {source.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`status-badge text-xs ${
                  source.status === 'completed' ? 'status-completed' :
                  source.status === 'processing' ? 'status-processing' :
                  source.status === 'failed' ? 'status-failed' : 'status-pending'
                }`}>
                  <StatusIcon size={10} className={source.status === 'processing' ? 'animate-spin' : ''} />
                  {source.status === 'completed' ? `${source.chunk_count} chunks` :
                   source.status === 'processing' ? 'Đang xử lý' :
                   source.status === 'failed' ? 'Lỗi' : 'Chờ'}
                </span>
              </div>
            </div>

            {/* Delete */}
            <button
              id={`source-delete-${source.id}`}
              onClick={(e) => handleDelete(source.id, e)}
              disabled={deleting === source.id}
              className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 rounded-md transition-opacity"
              style={{ color: '#f87171' }}
            >
              {deleting === source.id
                ? <Loader2 size={13} className="animate-spin" />
                : <Trash2 size={13} />
              }
            </button>
          </div>
        )
      })}

      {/* Refresh button if any processing */}
      {sources.some(s => s.status === 'processing' || s.status === 'pending') && (
        <button
          id="sources-refresh"
          onClick={onRefresh}
          className="w-full btn-ghost text-xs justify-center py-2"
        >
          <RefreshCw size={12} />
          Làm mới trạng thái
        </button>
      )}
    </div>
  )
}
