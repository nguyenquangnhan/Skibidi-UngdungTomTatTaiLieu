'use client'
import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, apiUrl } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, full_name: form.full_name }

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Đăng nhập / Đăng ký không thành công')
      login(data.access_token, data.user)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#090a0f]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md p-8 rounded-2xl bg-[#12151e] border border-white/[0.1] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <BookOpen size={22} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản Skibidi'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Đăng nhập để tiếp tục nghiên cứu tài liệu với GraphRAG'
              : 'Trải nghiệm tóm tắt tài liệu thông minh hoàn toàn miễn phí'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex p-1 rounded-xl bg-[#181c28] border border-white/[0.08] mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-fullname"
                type="text"
                placeholder="Họ và tên của bạn"
                className="input-field pl-10 text-xs"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-email"
              type="email"
              placeholder="Địa chỉ Email"
              className="input-field pl-10 text-xs"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className="input-field pl-10 pr-10 text-xs"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 leading-snug">
              {error}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            <span>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản'}</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Bảo mật với JWT 7 ngày & Mã hóa mật khẩu bcrypt
        </p>
      </div>
    </div>
  )
}
