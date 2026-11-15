'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Share2, Copy, Check, FileText, Sparkles, Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function StudyGroups({ notebookId, notebookTitle, sources = [] }) {
  const { user, authFetch } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const userId = user?.id || 'guest-user'
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Thành viên'
  const userEmail = user?.email || 'student@skibidi.ai'

  const loadGroups = useCallback(async () => {
    try {
      const res = await authFetch(`/api/groups?user_id=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data)
        if (selectedGroup) {
          const updated = data.find((g) => g.code === selectedGroup.code)
          if (updated) setSelectedGroup(updated)
        } else if (data.length > 0) {
          setSelectedGroup(data[0])
        }
      }
    } catch (e) {}
  }, [userId, authFetch, selectedGroup])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const createGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    try {
      const res = await authFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroupName.trim(),
          host_id: userId,
          host_name: userName,
          host_email: userEmail,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setNewGroupName('')
        setSelectedGroup(created)
        setGroups((prev) => [created, ...prev])
      }
    } catch (e) {}
  }

  const joinGroup = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    try {
      const res = await authFetch('/api/groups/join', {
        method: 'POST',
        body: JSON.stringify({
          code: joinCode.trim().toUpperCase(),
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
        }),
      })
      if (res.ok) {
        const joined = await res.json()
        setJoinCode('')
        setSelectedGroup(joined)
        loadGroups()
      }
    } catch (e) {}
  }

  const shareNotebookToGroup = async () => {
    if (!selectedGroup?.code) return
    try {
      const res = await authFetch(`/api/groups/${selectedGroup.code}/resources`, {
        method: 'POST',
        body: JSON.stringify({
          id: notebookId,
          title: notebookTitle,
          file_type: `${sources.length} nguồn tài liệu`,
          num_pages: Math.max(1, sources.reduce((acc, s) => acc + (s.chunk_count || 1), 0)),
          uploaded_by: userName,
          summary_tldr: `Sổ tay "${notebookTitle}" đã được xử lý OCR & lập chỉ mục GraphRAG (${sources.length} tài liệu).`,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedGroup(updated)
        setStatusMsg(`Đã chia sẻ Zero-Token sổ tay "${notebookTitle}" vào nhóm ${selectedGroup.code}!`)
        setTimeout(() => setStatusMsg(''), 3500)
      }
    } catch (e) {}
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 scrollbar-thin">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-indigo-500/10 to-transparent border border-emerald-500/25 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Users size={14} />
            <span>Zero-Token Study Groups</span>
          </div>
          <h2 className="text-xl font-bold text-white">Nhóm Học Tập & Chia Sẻ Học Liệu</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Trưởng nhóm xử lý AI 1 lần duy nhất và chia sẻ vào nhóm bằng mã PIN 6 ký tự (VD: <code className="text-emerald-300">VKU123</code>) để cả nhóm truy cập tức thì không tốn thêm token AI.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
          {statusMsg}
        </div>
      )}

      {/* Create & Join Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={createGroup} className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.08] flex gap-2.5">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Tên nhóm học tập mới (VD: Nhóm Đồ Án K23)..."
            className="input-field text-xs flex-1"
          />
          <button type="submit" className="btn-primary text-xs px-4 py-2 whitespace-nowrap flex items-center gap-1.5">
            <Plus size={14} />
            <span>Tạo nhóm</span>
          </button>
        </form>

        <form onSubmit={joinGroup} className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.08] flex gap-2.5">
          <input
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã nhóm 6 ký tự (VD: VKU123)..."
            className="input-field text-xs font-mono uppercase tracking-wider flex-1"
          />
          <button type="submit" className="btn-secondary text-xs px-4 py-2 whitespace-nowrap flex items-center gap-1.5">
            <Users size={14} />
            <span>Tham gia</span>
          </button>
        </form>
      </div>

      {/* Group Workspace */}
      {selectedGroup ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Sidebar */}
          <div className="p-5 rounded-2xl bg-[#11131c] border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedGroup.name}</h3>
                <span className="text-xs text-slate-400">{selectedGroup.members?.length || 1} thành viên</span>
              </div>
              <button
                onClick={() => copyCode(selectedGroup.code)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300 flex items-center gap-1.5"
              >
                <span>{selectedGroup.code}</span>
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            {selectedGroup.last_event && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2">
                <Bell size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{selectedGroup.last_event.message}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Danh sách thành viên</div>
              {selectedGroup.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                      style={{ backgroundColor: m.color || '#4F46E5' }}
                    >
                      {(m.name || 'U')[0].toUpperCase()}
                    </span>
                    <span className="font-medium text-white">{m.name}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Resources */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#11131c] border border-white/[0.08] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Kho Học Liệu Dùng Chung (Zero-Token)</h3>
                <p className="text-xs text-slate-400">Các sổ tay & tài liệu đã qua xử lý AI được chia sẻ trong nhóm</p>
              </div>
              <button
                onClick={shareNotebookToGroup}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Share2 size={13} />
                <span>Chia sẻ Sổ tay hiện tại</span>
              </button>
            </div>

            {(!selectedGroup.resources || selectedGroup.resources.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có tài liệu nào được chia sẻ. Nhấn <strong>"Chia sẻ Sổ tay hiện tại"</strong> để chia sẻ ngay!
              </div>
            ) : (
              <div className="space-y-3">
                {selectedGroup.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-indigo-400" />
                        <span className="text-sm font-bold text-white">{res.title}</span>
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        Zero-Token Ready
                      </span>
                    </div>
                    {res.summaryTldr && (
                      <p className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                        <Sparkles size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>{res.summaryTldr}</span>
                      </p>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Chia sẻ bởi <strong className="text-slate-200">{res.uploadedBy}</strong> · {res.fileType}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-[#11131c] border border-white/[0.08] text-center text-xs text-slate-400">
          Hãy tạo một nhóm học tập mới hoặc nhập mã 6 ký tự để tham gia cùng bạn bè.
        </div>
      )}
    </div>
  )
}

