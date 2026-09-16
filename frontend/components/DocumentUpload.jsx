'use client'
import { useState, useCallback } from 'react'
import { Upload, Link, FileText, Globe, Loader2, ArrowUpCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function DocumentUpload({ notebookId, onSourceAdded }) {
  const [tab, setTab] = useState('file') // 'file' | 'url'
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const { authFetch } = useAuth()

  const uploadFile = useCallback(async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/sources/upload`, {
        method: 'POST',
        headers: {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload tài liệu thất bại')
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
    if (!url.trim() || uploading) return
    setUploading(true)
    setError('')
    try {
      const res = await authFetch(`/api/notebooks/${notebookId}/sources/url`, {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Không thể cào nội dung từ URL này')
      onSourceAdded?.(data)
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }, [authFetch, notebookId, onSourceAdded, url, uploading])

  return (
    <div className="space-y-3">
      {/* Upload Type Switcher */}
      <div className="flex p-1 rounded-xl bg-[#181c28] border border-white/[0.08]">
        {[
          { key: 'file', label: 'Tải tệp tin (PDF / Ảnh)', icon: Upload },
          { key: 'url', label: 'Liên kết Web', icon: Link },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'file' ? (
        <label
          id="upload-dropzone"
          className={`relative block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group ${
            dragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
              : 'border-white/[0.12] bg-[#12151e] hover:border-indigo-500/40 hover:bg-[#161924]'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            disabled={uploading}
            onChange={handleFileInput}
          />

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUpCircle size={20} />
              )}
            </div>

            <p className="text-xs font-semibold text-white mb-1">
              {uploading ? 'Đang nạp và trích xuất tài liệu...' : 'Kéo thả file hoặc nhấp để chọn'}
            </p>
            <p className="text-[11px] text-slate-400">
              PDF văn bản, PDF scan (PP-OCRv6), PNG, JPG, WEBP (&lt; 50MB)
            </p>
          </div>
        </label>
      ) : (
        <form onSubmit={handleUrl} className="flex gap-2">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/bai-viet..."
              className="input-field pl-9 py-2 text-xs"
              required
              disabled={uploading}
            />
          </div>
          <button
            type="submit"
            disabled={!url.trim() || uploading}
            className="btn-primary text-xs px-3 py-2 flex-shrink-0"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : 'Nạp'}
          </button>
        </form>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
