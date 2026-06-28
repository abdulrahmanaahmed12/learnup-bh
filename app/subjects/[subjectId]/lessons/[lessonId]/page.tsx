import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import VideoPlayer from '@/components/video/VideoPlayer'
import CommentsSection from '@/components/subjects/CommentsSection'
import ProgressButton from '@/components/lesson/ProgressButton'
import LessonNotes from '@/components/notes/LessonNotes'
import QuizPanel from '@/components/quiz/QuizPanel'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, BookOpen, Bot, Award } from 'lucide-react'
import type { Profile, Lesson } from '@/lib/types'

interface Props {
  params: Promise<{ subjectId: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  const { subjectId, lessonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, subjects(name, icon)')
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  // Check access
  let hasAccess = lesson.is_free
  if (!hasAccess && user) {
    const { data: access } = await supabase
      .from('student_access')
      .select('id')
      .eq('student_id', user.id)
      .eq('subject_id', subjectId)
      .maybeSingle()
    hasAccess = !!access
  }

  if (!hasAccess) redirect(`/subjects/${subjectId}`)

  // Adjacent lessons
  const { data: allLessonsRaw } = await supabase
    .from('lessons')
    .select('id, title, is_free, order_index, subject_id, description, youtube_url, duration, created_at')
    .eq('subject_id', subjectId)
    .order('order_index')

  const allLessons = allLessonsRaw as Lesson[] | null
  const currentIdx = allLessons?.findIndex((l: Lesson) => l.id === lessonId) ?? -1
  const prevLesson = currentIdx > 0 ? allLessons![currentIdx - 1] : null
  const nextLesson = allLessons && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Progress for sidebar
  const completedIds: Set<string> = new Set()
  let isCompleted = false
  if (user) {
    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', user.id)
      .eq('subject_id', subjectId)
    progressRows?.forEach((r) => completedIds.add(r.lesson_id))
    isCompleted = completedIds.has(lessonId)
  }

  // Check if all lessons completed → eligible for certificate
  const allCompleted =
    allLessons && allLessons.length > 0 &&
    allLessons.every((l) => l.is_free || completedIds.has(l.id))

  const subject = lesson.subjects as { name: string; icon: string }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
          <ChevronLeft size={14} />
          <Link href={`/subjects/${subjectId}`} className="hover:text-white transition-colors">
            {subject.icon} {subject.name}
          </Link>
          <ChevronLeft size={14} />
          <span className="text-white/70 truncate max-w-[200px]">{lesson.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video + details */}
          <div className="lg:col-span-3 space-y-5">
            <VideoPlayer url={lesson.youtube_url} title={lesson.title} />

            <div className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">{lesson.title}</h1>
                  {lesson.description && (
                    <p className="text-white/60 text-sm">{lesson.description}</p>
                  )}
                </div>
                {user && (
                  <ProgressButton
                    lessonId={lessonId}
                    subjectId={subjectId}
                    initialCompleted={isCompleted}
                  />
                )}
              </div>
            </div>

            {/* Certificate CTA when all done */}
            {allCompleted && user && (
              <Link
                href={`/certificate/${subjectId}`}
                className="flex items-center gap-3 p-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 transition-all"
              >
                <Award size={24} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="text-yellow-300 font-bold text-sm">أكملت جميع الدروس!</p>
                  <p className="text-white/50 text-xs">اضغط هنا لتحميل شهادتك</p>
                </div>
              </Link>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              {prevLesson ? (
                <Link
                  href={`/subjects/${subjectId}/lessons/${prevLesson.id}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all text-sm"
                >
                  <ChevronRight size={16} />
                  <span className="truncate max-w-[140px]">{prevLesson.title}</span>
                </Link>
              ) : <div />}
              {nextLesson ? (
                <Link
                  href={`/subjects/${subjectId}/lessons/${nextLesson.id}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all text-sm"
                >
                  <span className="truncate max-w-[140px]">{nextLesson.title}</span>
                  <ChevronLeft size={16} />
                </Link>
              ) : <div />}
            </div>

            {/* Quiz */}
            {user && hasAccess && (
              <QuizPanel lessonId={lessonId} subjectId={subjectId} />
            )}

            {/* Notes */}
            {user && (
              <LessonNotes lessonId={lessonId} />
            )}

            {/* Comments */}
            {user && (
              <CommentsSection lessonId={lessonId} userId={user.id} isAdmin={profile?.role === 'admin'} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-3">
              {/* Progress summary */}
              {user && allLessons && allLessons.length > 0 && (
                <div className="p-4 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
                  <p className="text-white/50 text-xs mb-2">تقدّمك في المادة</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">{completedIds.size}/{allLessons.length}</span>
                    <span className="text-purple-300 text-xs">{Math.round((completedIds.size / allLessons.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${(completedIds.size / allLessons.length) * 100}%`, background: 'linear-gradient(90deg, #500078, #6b009f)' }}
                    />
                  </div>
                </div>
              )}

              {/* Lesson list */}
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#500078' }}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <BookOpen size={14} /> الدروس
                  </span>
                  <Link href={`/subjects/${subjectId}/ai`} className="text-purple-300 hover:text-white text-xs flex items-center gap-1 transition-colors">
                    <Bot size={12} /> AI
                  </Link>
                </div>
                <div className="divide-y divide-white/5 max-h-[65vh] overflow-y-auto">
                  {allLessons?.map((l: Lesson, idx: number) => (
                    <Link
                      key={l.id}
                      href={`/subjects/${subjectId}/lessons/${l.id}`}
                      className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                        l.id === lessonId
                          ? 'text-white font-semibold'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                      style={l.id === lessonId ? { background: 'rgba(255,255,255,0.1)' } : {}}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: completedIds.has(l.id) ? '#16a34a' : l.id === lessonId ? '#6b009f' : 'rgba(255,255,255,0.1)' }}
                      >
                        {completedIds.has(l.id) ? '✓' : idx + 1}
                      </span>
                      <span className="truncate">{l.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
