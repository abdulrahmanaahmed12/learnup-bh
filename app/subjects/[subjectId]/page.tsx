import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Lock, Play, FileText, Bot, CreditCard, CheckCircle, Clock } from 'lucide-react'
import type { Profile, Lesson } from '@/lib/types'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order_index')

  let hasAccess = false
  if (user) {
    const { data: access } = await supabase
      .from('student_access')
      .select('id')
      .eq('student_id', user.id)
      .eq('subject_id', subjectId)
      .maybeSingle()
    hasAccess = !!access
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile} />

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 p-8 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-6xl">{subject.icon || '📖'}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-1">{subject.name}</h1>
              <p className="text-white/50 mb-3">{subject.name_en}</p>
              {subject.description && <p className="text-white/70">{subject.description}</p>}
              <div className="flex gap-2 mt-3">
                {subject.level?.map((l: string) => (
                  <span key={l} className="text-xs px-3 py-1 rounded-full text-purple-200" style={{ background: 'rgba(255,255,255,0.1)' }}>{l}</span>
                ))}
              </div>
            </div>
            {hasAccess ? (
              <div className="flex flex-col gap-2 shrink-0">
                <span className="flex items-center gap-2 text-green-400 font-semibold">
                  <CheckCircle size={18} /> وصول مفعّل
                </span>
                <Link
                  href={`/subjects/${subjectId}/ai`}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
                >
                  <Bot size={16} /> المساعد الذكي
                </Link>
                <Link
                  href={`/subjects/${subjectId}/files`}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm border border-white/20 hover:bg-white/5 transition-all"
                >
                  <FileText size={16} /> الملفات والكتب
                </Link>
              </div>
            ) : (
              <div className="shrink-0 text-center">
                {subject.price && (
                  <div className="text-2xl font-black text-white mb-2">{subject.price} BD</div>
                )}
                {user ? (
                  <Link
                    href={`/payment/${subjectId}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
                  >
                    <CreditCard size={16} /> اشترك الآن
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
                  >
                    سجّل للوصول
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lessons */}
        <section>
          <h2 className="text-xl font-bold text-white mb-5">قائمة الدروس ({lessons?.length ?? 0})</h2>
          <div className="space-y-3">
            {lessons?.map((lesson: Lesson, idx: number) => {
              const canAccess = lesson.is_free || hasAccess
              return (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={idx + 1}
                  subjectId={subjectId}
                  canAccess={canAccess}
                />
              )
            })}
            {(!lessons || lessons.length === 0) && (
              <div className="text-center py-12 text-white/40">
                <Play size={40} className="mx-auto mb-3 opacity-30" />
                <p>الدروس قادمة قريباً</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function LessonRow({
  lesson,
  index,
  subjectId,
  canAccess,
}: {
  lesson: Lesson
  index: number
  subjectId: string
  canAccess: boolean
}) {
  const inner = (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        canAccess
          ? 'border-white/10 hover:border-purple-400/40 cursor-pointer'
          : 'border-white/5 opacity-60'
      }`}
      style={{ background: '#500078' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ background: canAccess ? 'linear-gradient(135deg, #500078, #6b009f)' : 'rgba(255,255,255,0.05)' }}
      >
        {canAccess ? index : <Lock size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{lesson.title}</h3>
        {lesson.description && (
          <p className="text-white/40 text-sm truncate">{lesson.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {lesson.is_free && (
          <span className="text-xs px-2 py-0.5 rounded-full text-green-300" style={{ background: 'rgba(52,211,153,0.1)' }}>
            مجاني
          </span>
        )}
        {lesson.duration && (
          <span className="text-white/40 text-sm flex items-center gap-1">
            <Clock size={12} /> {lesson.duration}
          </span>
        )}
        {canAccess ? (
          <Play size={16} className="text-purple-300" />
        ) : (
          <Lock size={14} className="text-white/20" />
        )}
      </div>
    </div>
  )

  if (canAccess) {
    return (
      <Link href={`/subjects/${subjectId}/lessons/${lesson.id}`}>
        {inner}
      </Link>
    )
  }
  return inner
}
