'use client'
import { X, ExternalLink, FileText, Globe, Image } from 'lucide-react'

export default function SourceViewer({ source, onClose }) {
  if (!source) return null

  const typeConfig = {
    pdf: { icon: FileText, label: 'PDF', color: '#ff8787' },
    image: { icon: Image, label: 'Ảnh', color: '#69db7c' },
    url: { icon: Globe, label: 'URL', color: '#74c0fc' },
  }
  const config = typeConfig[source.source_type] || typeConfig.url
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${config.color}20`, border: `1px solid ${config.color}40` }}>
            <Icon size={16} style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--text-bright)' }}>
              {source.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{config.label}</span>
              {source.chunk_count > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {source.chunk_count} chunks</span>
              )}
            </div>
          </div>
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {source.source_type === 'pdf' && source.file_path ? (
            <div className="text-center py-8">
              <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--primary)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                File PDF: <strong style={{ color: 'var(--text-bright)' }}>{source.title}</strong>
              </p>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/notebooks/${source.notebook_id}/sources/${source.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex"
              >
                <ExternalLink size={14} />
                Mở PDF
              </a>
            </div>
          ) : source.source_type === 'url' ? (
            <div className="text-center py-8">
              <Globe size={40} className="mx-auto mb-3" style={{ color: '#74c0fc' }} />
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>URL nguồn:</p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm break-all hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                {source.url}
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Không có preview cho loại tài liệu này.
              </p>
            </div>
          )}

          {source.error_message && (
            <div className="mt-4 p-3 rounded-lg status-failed text-xs">
              <strong>Lỗi xử lý:</strong> {source.error_message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
