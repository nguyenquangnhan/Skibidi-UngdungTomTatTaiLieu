'use client'
import { useState, useEffect, useCallback } from 'react'
import { HelpCircle, RefreshCw, CheckCircle2, XCircle, Trophy, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function QuizPanel({ notebookId, notebookTitle, hasCompletedSources }) {
  const { authFetch } = useAuth()
  const [questions, setQuestions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadQuiz = useCallback(async (regenerate = false) => {
    if (!notebookId) return
    setLoading(true)
    setError('')
    try {
      const res = regenerate
        ? await authFetch(`/api/notebooks/${notebookId}/quiz/generate`, {
            method: 'POST',
            body: JSON.stringify({ num_questions: 5, force_regenerate: true }),
          })
        : await authFetch(`/api/notebooks/${notebookId}/quiz?num_questions=5`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Không thể tải câu hỏi trắc nghiệm')
      setQuestions(data.questions || [])
      if (regenerate) setSelectedAnswers({})
    } catch (e) {
      setError(e.message || 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [notebookId, authFetch])

  useEffect(() => {
    loadQuiz(false)
  }, [loadQuiz])

  const handleSelect = (qId, opt) => {
    if (selectedAnswers[qId]) return
    setSelectedAnswers((prev) => ({ ...prev, [qId]: opt }))
  }

  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = questions.filter((q) => selectedAnswers[q.id] === q.correct_option).length

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <HelpCircle size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Trắc nghiệm Ôn tập AI</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {questions.length} câu hỏi
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động sinh từ nội dung tài liệu & Đồ thị Tri thức của <strong className="text-slate-200">{notebookTitle}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {questions.length > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300">
              <Trophy size={14} />
              <span>Điểm: {correctCount}/{questions.length} ({answeredCount} đã làm)</span>
            </div>
          )}

          <button
            onClick={() => loadQuiz(true)}
            disabled={loading}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>Sinh bộ đề mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
          <p className="text-sm font-medium text-slate-300">AI đang biên soạn bộ câu hỏi trắc nghiệm từ tài liệu...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => {
            const chosen = selectedAnswers[q.id]
            const options = [
              { key: 'A', text: q.option_a },
              { key: 'B', text: q.option_b },
              { key: 'C', text: q.option_c },
              { key: 'D', text: q.option_d },
            ]

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-[#11131c] border border-white/[0.08] space-y-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-white leading-relaxed">{q.question}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-10">
                  {options.map((opt) => {
                    const isSelected = chosen === opt.key
                    const isCorrect = q.correct_option === opt.key
                    let styleClass =
                      'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-200'

                    if (chosen) {
                      if (isCorrect) {
                        styleClass = 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                      } else if (isSelected && !isCorrect) {
                        styleClass = 'border-red-500/50 bg-red-500/15 text-red-200'
                      } else {
                        styleClass = 'border-white/[0.05] bg-white/[0.01] text-slate-500 opacity-70'
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelect(q.id, opt.key)}
                        disabled={!!chosen}
                        className={`text-left p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 transition-all ${styleClass}`}
                      >
                        <span className="font-bold text-indigo-400">{opt.key}.</span>
                        <span className="flex-1 leading-relaxed">{opt.text}</span>
                        {chosen && isCorrect && (
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        )}
                        {chosen && isSelected && !isCorrect && (
                          <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {chosen && (
                  <div className="ml-10 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-200 flex items-start gap-2">
                    <Sparkles size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300">Giải thích đáp án ({q.correct_option}): </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

