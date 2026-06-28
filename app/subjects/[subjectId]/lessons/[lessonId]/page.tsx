import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import VideoPlayer from '@/components/video/VideoPlayer'
import CommentsSection from '@/components/subjects/CommentsSection'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, BookOpen, Bot } from 'lucide-react'
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

  // Adjacent lessons for navigation
  const { data: allLessonsRaw } = await supabase
    .from('lessons')
    .select('id, title, is_free, order_index, subject_id, description, youtube_url, duration, created_at')
    .eq('subject_id', subjectId)
    .order('order_index')

  const allLessons = allLessonsRaw as Lesson[] | null
  const currentIdx = allLessons?.findIndex((l: Lesson) => l.id === lessonId) ?? -1
  const prevLesson = currentIdx > 0 ? allLessons![currentIdx - 1] : null
  const nextLesson = allLessons && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

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
          <div className="lg:col-span-3 space-y-6">
            <VideoPlayer url={lesson.youtube_url} title={lesson.title} />

            <div className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <h1 className="text-xl font-bold text-white mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-white/60 text-sm">{lesson.description}</p>
              )}
            </div>

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

            {/* Comments */}
            {user && (
              <CommentsSection lessonId={lessonId} userId={user.id} isAdmin={profile?.role === 'admin'} />
            )}
          </div>

          {/* Sidebar — lesson list */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#500078' }}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                  <BookOpen size={14} /> الدروس
                </span>
                <Link href={`/subjects/${subjectId}/ai`} className="text-purple-300 hover:text-white text-xs flex items-center gap-1 transition-colors">
                  <Bot size={12} /> AI
                </Link>
              </div>
              <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
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
                    <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: l.id === lessonId ? '#6b009f' : 'rgba(255,255,255,0.1)' }}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
