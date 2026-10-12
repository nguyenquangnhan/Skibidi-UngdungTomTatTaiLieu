'use client'

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { FileText, Loader2, Sparkles, Upload, X } from 'lucide-react'
import React from 'react'

type DocumentUploadZoneProps = {
  onSummarize: (file: File) => void | Promise<void>
  isProcessing?: boolean
  progress?: number
}

const supportedExtensions = ['pdf', 'docx', 'txt']

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUploadZone({
  onSummarize,
  isProcessing = false,
  progress,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const processing = isProcessing || isSubmitting
  const safeProgress = typeof progress === 'number'
    ? Math.min(100, Math.max(0, progress))
    : undefined

  function selectFile(file?: File) {
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !supportedExtensions.includes(extension)) {
      setError('Chỉ hỗ trợ file PDF, DOCX hoặc TXT.')
      setSelectedFile(null)
      return
    }

    setError('')
    setSelectedFile(file)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files[0])
  }

  function removeFile() {
    setSelectedFile(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSummarize() {
    if (!selectedFile || processing) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSummarize(selectedFile)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể tóm tắt tài liệu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-xl border border-white/[0.12] bg-[#11131a] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
      <input
        ref={inputRef}
        id="document-upload-input"
        name="document"
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        tabIndex={-1}
        disabled={processing}
        onChange={handleInputChange}
      />

      <div className="mb-4">
        <h2 className="text-base font-semibold text-white [text-wrap:balance]">Tải tài liệu lên</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">PDF, DOCX hoặc TXT</p>
      </div>

      {!selectedFile ? (
        <label
          htmlFor="document-upload-input"
          role="button"
          tabIndex={0}
          aria-label="Chọn tài liệu PDF, DOCX hoặc TXT"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-400/[0.08]'
              : 'border-white/[0.16] bg-[#090a0f] hover:border-cyan-400/60'
          }`}
        >
          <span className="mb-4 flex size-12 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Upload aria-hidden="true" size={21} />
          </span>
          <span className="text-sm font-medium text-slate-100">Kéo thả tài liệu vào đây</span>
          <span className="mt-1 text-sm text-slate-400">hoặc nhấn để chọn file</span>
          <span className="mt-4 text-xs text-slate-500">PDF · DOCX · TXT</span>
        </label>
      ) : (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/[0.1] bg-[#090a0f] p-3 sm:p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
            <FileText aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100" title={selectedFile.name}>
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs tabular-nums text-slate-400">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            disabled={processing}
            aria-label="Xóa file đã chọn"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {selectedFile && processing && (
        <div className="mt-4" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <Loader2 aria-hidden="true" size={14} className="animate-spin motion-reduce:animate-none" />
              Đang xử lý tài liệu…
            </span>
            {safeProgress !== undefined && (
              <span className="shrink-0 tabular-nums text-slate-400">{Math.round(safeProgress)}%</span>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Tiến trình tóm tắt tài liệu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
            className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]"
          >
            <div
              className={`h-full rounded-full bg-cyan-300 ${safeProgress === undefined ? 'w-1/3 animate-pulse motion-reduce:animate-none' : ''}`}
              style={safeProgress === undefined ? undefined : { width: `${safeProgress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSummarize}
        disabled={!selectedFile || processing}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#090a0f] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-200 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 motion-reduce:transition-none"
      >
        {processing ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Sparkles aria-hidden="true" size={16} />}
        {processing ? 'Đang tóm tắt…' : 'Bắt đầu tóm tắt'}
      </button>
    </section>
  )
}