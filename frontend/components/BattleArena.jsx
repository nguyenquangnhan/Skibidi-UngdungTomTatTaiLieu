'use client'
import { useState, useEffect, useCallback } from 'react'
import { Swords, Users, Play, Trophy, Clock, Copy, Check, LogOut, Sparkles, Crown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function BattleArena({ notebookId, notebookTitle }) {
  const { user, authFetch } = useAuth()
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [playerName, setPlayerName] = useState(user?.full_name || user?.email?.split('@')[0] || 'Chiến binh AI')
  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remainingSec, setRemainingSec] = useState(0)

  const playerId = user?.id || 'guest-player'

  const createRoom = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/battle/rooms', {
        method: 'POST',
        body: JSON.stringify({
          host_id: playerId,
          host_name: playerName,
          notebook_id: notebookId,
          notebook_title: notebookTitle,
          num_questions: 5,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Không thể tạo phòng đấu trí')
      setRoom(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async (e) => {
    e?.preventDefault()
    if (!roomCodeInput.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/battle/rooms/${roomCodeInput.trim()}/join`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: playerId,
          user_name: playerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Mã phòng không tồn tại hoặc đã bắt đầu')
      setRoom(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const startRoom = async () => {
    if (!room?.room_code) return
    try {
      const res = await authFetch(`/api/battle/rooms/${room.room_code}/start`, {
        method: 'POST',
        body: JSON.stringify({ user_id: playerId }),
      })
      const data = await res.json()
      if (res.ok) setRoom(data)
    } catch (e) {}
  }

  const submitAnswer = async (optKey) => {
    if (!room?.room_code || room.my_answer) return
    try {
      await authFetch(`/api/battle/rooms/${room.room_code}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: playerId,
          question_index: room.question_index,
          option: optKey,
        }),
      })
      fetchState()
    } catch (e) {}
  }

  const leaveRoom = async () => {
    if (room?.room_code) {
      try {
        await authFetch(`/api/battle/rooms/${room.room_code}/leave`, {
          method: 'POST',
          body: JSON.stringify({ user_id: playerId }),
        })
      } catch (e) {}
    }
    setRoom(null)
    setRoomCodeInput('')
  }

  const fetchState = useCallback(async () => {
    if (!room?.room_code) return
    try {
      const res = await authFetch(`/api/battle/rooms/${room.room_code}?user_id=${encodeURIComponent(playerId)}`)
      if (res.ok) {
        const data = await res.json()
        setRoom(data)
        if (data.phase_ends_at && data.server_now) {
          setRemainingSec(Math.max(0, Math.ceil(data.phase_ends_at - data.server_now)))
        } else {
          setRemainingSec(0)
        }
      }
    } catch (e) {}
  }, [room?.room_code, playerId, authFetch])

  useEffect(() => {
    if (!room?.room_code) return
    const timer = setInterval(fetchState, 1000)
    return () => clearInterval(timer)
  }, [room?.room_code, fetchState])

  const copyRoomCode = () => {
    if (!room?.room_code) return
    navigator.clipboard?.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 scrollbar-thin">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent border border-indigo-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Swords size={15} />
              <span>Realtime Multiplayer Quiz Battle</span>
            </div>
            <h2 className="text-xl font-bold text-white">Đấu Trí Trắc Nghiệm Thời Gian Thực</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Tạo phòng bằng mã PIN 6 số từ sổ tay <strong className="text-white">{notebookTitle}</strong> hoặc nhập mã phòng của bạn bè để thi đấu đồng bộ theo đồng hồ máy chủ (15s/câu, thưởng điểm tốc độ).
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Biệt danh thi đấu:</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input-field py-1.5 px-3 text-xs max-w-xs"
            placeholder="Nhập tên hiển thị..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="p-6 rounded-2xl bg-[#11131c] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Crown size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Tạo Phòng Thi Đấu Mới</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống tự sinh mã PIN 6 số và bộ 5 câu hỏi từ sổ tay hiện tại. Bạn là Chủ phòng điều khiển thời điểm bắt đầu.
              </p>
            </div>
            <button
              onClick={createRoom}
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Play size={14} />
              <span>{loading ? 'Đang khởi tạo phòng...' : 'Tạo phòng & Lấy mã 6 số'}</span>
            </button>
          </div>

          {/* Join Room Card */}
          <form onSubmit={joinRoom} className="p-6 rounded-2xl bg-[#11131c] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Tham Gia Phòng Bằng Mã PIN</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập mã PIN 6 chữ số từ Chủ phòng để vào sảnh chờ thi đấu.
              </p>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã 6 số (VD: 482910)"
                className="input-field text-center tracking-[0.35em] font-mono text-base font-bold py-2.5"
              />
            </div>
            <button
              type="submit"
              disabled={loading || roomCodeInput.length < 6}
              className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Swords size={14} />
              <span>Vào phòng ngay</span>
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 scrollbar-thin">
      {/* Room Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#11131c] border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Mã PIN:</span>
            <span className="font-mono text-base font-extrabold text-indigo-300 tracking-widest">
              {room.room_code}
            </span>
            <button
              onClick={copyRoomCode}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Sao chép mã phòng"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{room.notebook_title}</h3>
            <span className="text-xs text-slate-400">
              {room.players?.length || 1} người chơi · {room.total_questions} câu hỏi
            </span>
          </div>
        </div>

        <button
          onClick={leaveRoom}
          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs text-red-300 flex items-center gap-1.5"
        >
          <LogOut size={13} />
          <span>Rời phòng</span>
        </button>
      </div>

      {/* Waiting Phase */}
      {room.phase === 'waiting' && (
        <div className="p-8 rounded-2xl bg-[#11131c] border border-white/[0.08] text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Sảnh Chờ Thi Đấu</h3>
            <p className="text-xs text-slate-400">
              Chia sẻ mã PIN <strong className="text-indigo-300 font-mono">{room.room_code}</strong> cho các thành viên khác để cùng vào phòng.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {room.players?.map((p) => (
              <div
                key={p.user_id}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-2"
              >
                {p.is_host && <Crown size={13} className="text-amber-400" />}
                <span>{p.name}</span>
              </div>
            ))}
          </div>

          {room.is_host ? (
            <button onClick={startRoom} className="btn-primary px-8 py-3 text-xs font-bold mx-auto">
              <Play size={15} />
              <span>Bắt Đầu Trận Đấu Ngay</span>
            </button>
          ) : (
            <p className="text-xs text-amber-300 animate-pulse">
              Đang chờ Chủ phòng bấm Bắt đầu...
            </p>
          )}
        </div>
      )}

      {/* Countdown Phase */}
      {room.phase === 'countdown' && (
        <div className="p-12 rounded-2xl bg-[#11131c] border border-indigo-500/30 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Trận đấu sắp bắt đầu</p>
          <div className="text-5xl font-extrabold text-white">{remainingSec || 3}</div>
          <p className="text-xs text-slate-400">Chuẩn bị trả lời câu hỏi đầu tiên!</p>
        </div>
      )}

      {/* Question / Reveal Phase */}
      {(room.phase === 'question' || room.phase === 'reveal') && room.question && (
        <div className="p-6 rounded-2xl bg-[#11131c] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
              Câu {room.question_index + 1} / {room.total_questions}
            </span>
            <span className="flex items-center gap-1.5 font-mono font-bold text-amber-300">
              <Clock size={14} />
              <span>{room.phase === 'question' ? `Còn ${remainingSec}s` : 'Công bố đáp án'}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-relaxed">{room.question.question}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {room.question.options?.map((opt) => {
              const myChoice = room.my_answer?.option
              const isSelected = myChoice === opt.key
              const isCorrect = room.question.correct_option === opt.key

              let cls = 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-slate-100'
              if (room.phase === 'reveal') {
                if (isCorrect) cls = 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200'
                else if (isSelected) cls = 'border-red-500/60 bg-red-500/20 text-red-200'
              } else if (isSelected) {
                cls = 'border-indigo-500 bg-indigo-500/20 text-white'
              }

              return (
                <button
                  key={opt.key}
                  disabled={room.phase !== 'question' || !!room.my_answer}
                  onClick={() => submitAnswer(opt.key)}
                  className={`p-4 rounded-xl border text-left text-xs font-medium flex items-start gap-2.5 transition-all ${cls}`}
                >
                  <span className="font-bold text-indigo-400">{opt.key}.</span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              )
            })}
          </div>

          {room.phase === 'reveal' && room.question.explanation && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-slate-200 flex items-start gap-2">
              <Sparkles size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <span>{room.question.explanation}</span>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard / Finished Podium */}
      <div className="p-5 rounded-2xl bg-[#11131c] border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Trophy size={14} />
          <span>{room.phase === 'finished' ? 'Bảng Vàng Chung Cuộc (Podium)' : 'Bảng Xếp Hạng Trực Tiếp'}</span>
        </div>
        <div className="space-y-2">
          {room.players?.map((p) => (
            <div
              key={p.user_id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center">
                  #{p.rank}
                </span>
                <span className="font-semibold text-white">{p.name}</span>
                {p.is_host && <Crown size={12} className="text-amber-400" />}
              </div>
              <div className="flex items-center gap-4 text-slate-300">
                <span>Đúng: {p.correct}</span>
                <span className="font-bold text-emerald-400">{p.score} điểm</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
