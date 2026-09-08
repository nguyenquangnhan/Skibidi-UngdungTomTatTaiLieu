'use client'
import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react'
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
      if (!res.ok) throw new Error(data.detail || 'Có lỗi xảy ra')
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card w-full max-w-md p-8 animate-slide-up shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-ghost p-2 rounded-lg"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
            <BookOpen size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-bright)' }}>
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Chào mừng trở lại!' : 'Bắt đầu miễn phí ngay hôm nay'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                id="auth-fullname"
                type="text"
                placeholder="Họ và tên"
                className="input-field pl-9"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              id="auth-email"
              type="email"
              placeholder="Email"
              className="input-field pl-9"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className="input-field pl-9 pr-10"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm status-failed">
              {error}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            id="auth-switch-mode"
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
            className="font-medium hover:underline transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}
