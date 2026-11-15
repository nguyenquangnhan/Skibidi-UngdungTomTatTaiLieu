'use client'
import { useState, useEffect } from 'react'
import {
  User, Mail, Lock, ShieldCheck, BookOpen, FileText,
  Layers, MessageSquare, X, CheckCircle2, AlertCircle, LogOut, Sparkles
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ProfileModal({ onClose, onLogout }) {
  const { user, updateUser, authFetch } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security'

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileErr, setProfileErr] = useState(null)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordErr, setPasswordErr] = useState(null)

  // Stats state
  const [stats, setStats] = useState({
    notebook_count: 0,
    source_count: 0,
    completed_source_count: 0,
    total_chunks: 0,
    chat_message_count: 0,
    has_password: true,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      try {
        const res = await authFetch('/auth/stats')
        if (res.ok && mounted) {
          const data = await res.json()
          setStats(data)
        }
      } catch (e) {
      } finally {
        if (mounted) setLoadingStats(false)
      }
    }
    fetchStats()
    return () => {
      mounted = false
    }
  }, [authFetch])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileErr(null)
    if (!fullName.trim()) {
      setProfileErr('Họ và tên không được để trống')
      return
    }
    setSavingProfile(true)
    try {
      const res = await authFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Không thể cập nhật hồ sơ')
      }
      updateUser(data)
      setProfileMsg('Đã lưu thông tin hồ sơ thành công!')
    } catch (err) {
      setProfileErr(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)
    setPasswordErr(null)

    if (newPassword.trim().length < 6) {
      setPasswordErr('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Mật khẩu xác nhận không khớp')
      return
    }

    setSavingPassword(true)
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword || null,
          new_password: newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Không thể đổi mật khẩu')
      }
      setPasswordMsg('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStats(prev => ({ ...prev, has_password: true }))
    } catch (err) {
      setPasswordErr(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null

  const initials = (user.full_name || user.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#10131c] border border-white/[0.1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-gradient-to-r from-indigo-600/15 via-[#141824] to-[#10131c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="w-11 h-11 rounded-2xl object-cover border border-indigo-500/40 flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-600 text-white font-bold text-base shadow-[0_0_15px_rgba(99,102,241,0.4)] flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {user.full_name || 'Chưa đặt tên hiển thị'}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                  <Sparkles size={10} /> Thành viên
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex border-b border-white/[0.08] bg-[#0c0e15] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Hồ sơ & Thống kê</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock size={14} />
            <span>Bảo mật & Mật khẩu</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin">
          {activeTab === 'profile' ? (
            <>
              {/* Activity Overview Grid */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Thống kê hoạt động học tập
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-indigo-400 mb-1">
                      <BookOpen size={14} />
                      <span className="text-[10px] text-slate-400">Sổ tay</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {loadingStats ? '…' : stats.notebook_count}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-emerald-400 mb-1">
                      <FileText size={14} />
                      <span className="text-[10px] text-slate-400">Tài liệu</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {loadingStats ? '…' : stats.completed_source_count}
                      <span className="text-xs font-normal text-slate-400">/{stats.source_count}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-amber-400 mb-1">
                      <Layers size={14} />
                      <span className="text-[10px] text-slate-400">Chunks</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {loadingStats ? '…' : stats.total_chunks}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-purple-400 mb-1">
                      <MessageSquare size={14} />
                      <span className="text-[10px] text-slate-400">Hỏi đáp</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {loadingStats ? '…' : stats.chat_message_count}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email đăng nhập (Không thể thay đổi)
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="input-field pl-9 py-2.5 text-xs opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Họ và tên hiển thị (Dùng trong Đấu trí Live & Nhóm học tập)
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn..."
                      className="input-field pl-9 py-2.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    URL Ảnh đại diện (Tuỳ chọn)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="input-field py-2.5 text-xs"
                  />
                </div>

                {profileErr && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{profileErr}</span>
                  </div>
                )}

                {profileMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="flex-shrink-0" />
                    <span>{profileMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 gap-3">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                  >
                    <LogOut size={14} />
                    <span>Đăng xuất</span>
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary px-5 py-2.5 text-xs"
                  >
                    {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {stats.has_password
                    ? 'Nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 6 ký tự) để bảo vệ tài khoản của bạn.'
                    : 'Tài khoản Google của bạn chưa đặt mật khẩu riêng. Bạn có thể thiết lập mật khẩu mới bên dưới.'}
                </p>
              </div>

              {stats.has_password && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field py-2.5 text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mật khẩu mới (Tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field py-2.5 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field py-2.5 text-xs"
                  required
                />
              </div>

              {passwordErr && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{passwordErr}</span>
                </div>
              )}

              {passwordMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  <span>{passwordMsg}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-primary px-5 py-2.5 text-xs"
                >
                  {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

