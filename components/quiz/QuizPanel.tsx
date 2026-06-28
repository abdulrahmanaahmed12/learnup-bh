'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, HelpCircle, Trophy, RefreshCw } from 'lucide-react'
import type { Quiz, QuizQuestion, QuizResult } from '@/lib/types'

interface Props {
  lessonId: string
  subjectId: string
}

export default function QuizPanel({ lessonId }: Props) {
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [prevResult, setPrevResult] = useState<QuizResult | null>(null)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [graded, setGraded] = useState<Array<{ question_id: string; selected: number; correct: boolean }>>([])
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/quiz?lesson_id=${lessonId}`)
    const data = await res.json()
    setQuiz(data.quiz)
    setQuestions(data.questions ?? [])
    if (data.result) {
      setPrevResult(data.result)
      setScore(data.result.score)
      setGraded(data.result.answers ?? [])
      setSubmitted(true)
      const sel: Record<string, number> = {}
      data.result.answers?.forEach((a: { question_id: string; selected: number }) => { sel[a.question_id] = a.selected })
      setSelected(sel)
    }
    setLoading(false)
  }, [lessonId])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    if (Object.keys(selected).length < questions.length) return
    setSubmitting(true)
    const answers = questions.map((q) => ({ question_id: q.id, selected: selected[q.id] ?? -1 }))
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quiz?.id, lesson_id: lessonId, answers }),
    })
    const data = await res.json()
    setScore(data.score)
    setGraded(data.graded ?? [])
    setSubmitted(true)
    setSubmitting(false)
  }

  function resetQuiz() {
    setSelected({})
    setSubmitted(false)
    setGraded([])
    setPrevResult(null)
  }

  if (loading) return (
    <div className="p-5 rounded-2xl border border-white/10 animate-pulse" style={{ background: '#500078' }}>
      <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
      <div className="h-3 bg-white/10 rounded w-full" />
    </div>
  )

  if (!quiz || questions.length === 0) return null

  const pct = submitted ? Math.round((score / questions.length) * 100) : 0
  const passed = pct >= 60

  return (
    <div className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <HelpCircle size={18} className="text-purple-300" />
          اختبار سريع: {quiz.title}
        </h3>
        {submitted && (
          <button onClick={resetQuiz} className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors">
            <RefreshCw size={12} /> إعادة
          </button>
        )}
      </div>

      {submitted && (
        <div className={`mb-5 p-4 rounded-xl flex items-center gap-4 ${passed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <Trophy size={28} className={passed ? 'text-yellow-400' : 'text-red-400'} />
          <div>
            <p className={`text-lg font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>
              {score}/{questions.length} ({pct}%)
            </p>
            <p className="text-white/60 text-sm">{passed ? '🎉 أحسنت! نجحت في الاختبار' : 'حاول مرة ثانية، أنت قادر!'}</p>
            {prevResult && (
              <p className="text-white/30 text-xs mt-0.5">
                آخر محاولة: {new Date(prevResult.completed_at).toLocaleDateString('ar-BH')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const gradedQ = graded.find((g) => g.question_id === q.id)
          return (
            <div key={q.id}>
              <p className="text-white font-semibold mb-3 text-sm">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selected[q.id] === oi
                  const isCorrect = q.correct_index === oi
                  let cls = 'border-white/10 text-white/70'
                  if (submitted) {
                    if (isCorrect) cls = 'border-green-500/50 bg-green-500/10 text-green-300'
                    else if (isSelected && !isCorrect) cls = 'border-red-500/50 bg-red-500/10 text-red-300'
                    else cls = 'border-white/5 text-white/30'
                  } else if (isSelected) {
                    cls = 'border-purple-400/60 text-white'
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => !submitted && setSelected((s) => ({ ...s, [q.id]: oi }))}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-right transition-all ${cls} ${!submitted ? 'hover:border-purple-400/40 cursor-pointer' : 'cursor-default'}`}
                    >
                      {submitted && isCorrect && <CheckCircle size={14} className="text-green-400 shrink-0" />}
                      {submitted && isSelected && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                      {(!submitted || (!isCorrect && !isSelected)) && (
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0">
                          {['أ','ب','ج','د'][oi]}
                        </span>
                      )}
                      {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && q.explanation && gradedQ && !gradedQ.correct && (
                <p className="mt-2 text-xs text-yellow-300/80 bg-yellow-400/5 rounded-lg px-3 py-2">
                  💡 {q.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selected).length < questions.length}
          className="mt-5 w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          {submitting ? 'جاري التصحيح...' : `تسليم الإجابات (${Object.keys(selected).length}/${questions.length})`}
        </button>
      )}
    </div>
  )
}
