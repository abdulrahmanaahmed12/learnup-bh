import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: fetch quiz + questions for a lesson
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const lesson_id = request.nextUrl.searchParams.get('lesson_id')
  if (!lesson_id) return NextResponse.json({ quiz: null })

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lesson_id)
    .maybeSingle()

  if (!quiz) return NextResponse.json({ quiz: null })

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order_index')

  const { data: result } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('student_id', user.id)
    .eq('quiz_id', quiz.id)
    .maybeSingle()

  return NextResponse.json({ quiz, questions: questions ?? [], result })
}

// POST: submit quiz answers
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { quiz_id, lesson_id, answers } = await request.json()
  // answers: [{ question_id, selected }]

  // Fetch correct answers
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_index')
    .eq('quiz_id', quiz_id)

  if (!questions) return NextResponse.json({ error: 'خطأ في التحميل' }, { status: 500 })

  const graded = answers.map((a: { question_id: string; selected: number }) => {
    const q = questions.find((q) => q.id === a.question_id)
    return { ...a, correct: q?.correct_index === a.selected }
  })

  const score = graded.filter((a: { correct: boolean }) => a.correct).length

  await supabase.from('quiz_results').upsert(
    { student_id: user.id, quiz_id, lesson_id, score, total: questions.length, answers: graded, completed_at: new Date().toISOString() },
    { onConflict: 'student_id,quiz_id' }
  )

  return NextResponse.json({ score, total: questions.length, graded })
}
