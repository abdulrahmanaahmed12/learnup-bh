'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, HelpCircle, ChevronDown } from 'lucide-react'

interface Subject { id: string; name: string }
interface Lesson { id: string; title: string; subject_id: string }
interface Question {
  id?: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  order_index: number
}

export default function QuizzesPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('subjects').select('id, name').eq('is_active', true).then(({ data }) => {
      setSubjects(data ?? [])
    })
  }, [supabase])

  useEffect(() => {
    if (!selectedSubject) return
    supabase.from('lessons').select('id, title, subject_id').eq('subject_id', selectedSubject).order('order_index').then(({ data }) => {
      setLessons(data ?? [])
      setSelectedLesson('')
      setQuizId(null)
      setQuestions([])
      setQuizTitle('')
    })
  }, [selectedSubject, supabase])

  const loadQuiz = useCallback(async (lessonId: string) => {
    const { data: quiz } = await supabase.from('quizzes').select('*').eq('lesson_id', lessonId).maybeSingle()
    if (quiz) {
      setQuizId(quiz.id)
      setQuizTitle(quiz.title)
      const { data: qs } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('order_index')
      setQuestions(qs?.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? '',
        order_index: q.order_index,
      })) ?? [])
    } else {
      setQuizId(null)
      setQuizTitle('')
      setQuestions([])
    }
  }, [supabase])

  useEffect(() => {
    if (!selectedLesson) return
    loadQuiz(selectedLesson)
  }, [selectedLesson, loadQuiz])

  function addQuestion() {
    setQuestions((prev) => [...prev, {
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      order_index: prev.length,
    }])
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx: number, field: keyof Question, value: unknown) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qi) return q
      const opts = [...q.options]
      opts[oi] = val
      return { ...q, options: opts }
    }))
  }

  async function saveQuiz() {
    if (!selectedLesson || !quizTitle.trim() || questions.length === 0) {
      setMessage('أدخل عنوان الاختبار وسؤال واحد على الأقل')
      return
    }
    setSaving(true)
    setMessage('')

    let currentQuizId = quizId
    if (!currentQuizId) {
      const { data } = await supabase.from('quizzes').insert({
        lesson_id: selectedLesson,
        subject_id: selectedSubject,
        title: quizTitle,
      }).select().single()
      currentQuizId = data?.id
      setQuizId(currentQuizId!)
    } else {
      await supabase.from('quizzes').update({ title: quizTitle }).eq('id', currentQuizId)
    }

    if (!currentQuizId) { setSaving(false); return }

    // Delete old questions and re-insert
    await supabase.from('quiz_questions').delete().eq('quiz_id', currentQuizId)

    const toInsert = questions.map((q, i) => ({
      quiz_id: currentQuizId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation || null,
      order_index: i,
    }))

    await supabase.from('quiz_questions').insert(toInsert)
    await loadQuiz(selectedLesson)
    setMessage('✓ تم حفظ الاختبار')
    setSaving(false)
  }

  async function deleteQuiz() {
    if (!quizId || !confirm('هل تريد حذف هذا الاختبار؟')) return
    await supabase.from('quizzes').delete().eq('id', quizId)
    setQuizId(null)
    setQuizTitle('')
    setQuestions([])
    setMessage('تم حذف الاختبار')
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
        <HelpCircle size={22} /> إدارة الاختبارات
      </h1>

      {/* Subject + Lesson selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-white/60 text-sm mb-1 block">المادة</label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm appearance-none pr-10"
              style={{ background: '#500078', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">اختر المادة...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-white/60 text-sm mb-1 block">الدرس</label>
          <div className="relative">
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              disabled={!selectedSubject}
              className="w-full px-4 py-3 rounded-xl text-white text-sm appearance-none pr-10 disabled:opacity-40"
              style={{ background: '#500078', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">اختر الدرس...</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedLesson && (
        <div className="space-y-5">
          {/* Quiz title */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">عنوان الاختبار</label>
            <input
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="مثال: اختبار الدرس الأول"
              className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none"
              style={{ background: '#500078', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Questions */}
          {questions.map((q, qi) => (
            <div key={qi} className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">سؤال {qi + 1}</span>
                <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea
                value={q.question}
                onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                placeholder="نص السؤال..."
                rows={2}
                className="w-full px-4 py-2 rounded-xl text-white text-sm placeholder-white/30 outline-none resize-none mb-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct_index === oi}
                      onChange={() => updateQuestion(qi, 'correct_index', oi)}
                      className="accent-purple-500"
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`خيار ${['أ','ب','ج','د'][oi]}`}
                      className="flex-1 px-3 py-2 rounded-lg text-white text-sm placeholder-white/30 outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                ))}
              </div>
              <input
                value={q.explanation}
                onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                placeholder="شرح الإجابة الصحيحة (اختياري)"
                className="w-full px-3 py-2 rounded-lg text-white/60 text-xs placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/60 border border-white/10 border-dashed hover:text-white hover:border-white/30 transition-all text-sm w-full justify-center"
          >
            <Plus size={16} /> إضافة سؤال
          </button>

          {message && (
            <p className={`text-sm text-center ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveQuiz}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
            >
              <Save size={16} /> {saving ? 'يحفظ...' : 'حفظ الاختبار'}
            </button>
            {quizId && (
              <button
                onClick={deleteQuiz}
                className="px-4 py-3 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedLesson && (
        <div className="text-center py-16 text-white/30">
          <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>اختر مادة ودرساً لإدارة الاختبار</p>
        </div>
      )}
    </AdminLayout>
  )
}
