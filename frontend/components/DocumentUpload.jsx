'use client'
import { useState, useCallback } from 'react'
import { Upload, Link, X, FileText, Image, Globe, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, label: 'Hoàn thành', cls: 'status-completed' },
  processing: { icon: Loader2, label: 'Đang xử lý', cls: 'status-processing' },
  failed: { icon: AlertCircle, label: 'Lỗi', cls: 'status-failed' },
  pending: { icon: Clock, label: 'Chờ xử lý', cls: 'status-pending' },
}

const TYPE_ICONS = {
  pdf: FileText,
  image: Image,
  url: Globe,
}

export default function DocumentUpload({ notebookId, onSourceAdded }) {
  const [tab, setTab] = useState('file') // 'file' | 'url'
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const { authFetch } = useAuth()

  const uploadFile = useCallback(async (file) => {
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/sources/upload`, {
        method: 'POST',
        headers: {},  // Let browser set multipart boundary
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload thất bại')
      onSourceAdded?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }, [authFetch, notebookId, onSourceAdded])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleUrl = useCallback(async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setUploading(true)
    setError('')
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/sources/url`, {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi thêm URL')
      onSourceAdded?.(data)
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }, [authFetch, notebookId, onSourceAdded, url])

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-3)' }}>
        {[
          { key: 'file', label: 'Upload File', icon: Upload },
          { key: 'url', label: 'Từ URL', icon: Link },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`upload-tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              tab === key ? 'text-white shadow' : ''
            }`}
            style={tab === key ? { background: 'var(--primary)' } : { color: 'var(--text-muted)' }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'file' ? (
        <label
          id="upload-dropzone"
          className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragging ? 'scale-105' : ''
          }`}
          style={{
            borderColor: dragging ? 'var(--primary)' : 'var(--border)',
            background: dragging ? 'var(--primary-glow)' : 'var(--surface-3)',
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff"
            onChange={handleFileInput}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Đang tải lên...</p>
            </div>
          ) : (
            <>
              <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--primary)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--text-bright)' }}>
                Kéo thả file vào đây
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Hỗ trợ: PDF, PNG, JPG, WEBP, GIF (tối đa 50MB)
              </p>
            </>
          )}
        </label>
      ) : (
        <form onSubmit={handleUrl} className="space-y-3">
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              id="upload-url-input"
              type="url"
              placeholder="https://example.com/article"
              className="input-field pl-9"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              disabled={uploading}
            />
          </div>
          <button
            id="upload-url-submit"
            type="submit"
            disabled={uploading || !url.trim()}
            className="btn-primary w-full justify-center"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
            {uploading ? 'Đang xử lý...' : 'Thêm URL'}
          </button>
        </form>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg status-failed text-xs">
          <AlertCircle size={13} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
