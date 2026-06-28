import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CertificateCanvas from '@/components/certificate/CertificateCanvas'
import Link from 'next/link'
import { ChevronLeft, Award, Lock } from 'lucide-react'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function CertificatePage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  // Verify student has access
  const { data: access } = await supabase
    .from('student_access')
    .select('id')
    .eq('student_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (!access) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
        <Navbar profile={profile as Profile} />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <Lock size={48} className="mx-auto mb-4 text-white/20" />
          <h1 className="text-2xl font-bold text-white mb-2">غير مصرح</h1>
          <p className="text-white/50 mb-6">يجب الاشتراك في هذه المادة أولاً</p>
          <Link href={`/subjects/${subjectId}`} className="text-purple-300 hover:text-white transition-colors">
            العودة للمادة
          </Link>
        </main>
      </div>
    )
  }

  // Verify all lessons completed
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('subject_id', subjectId)

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', user.id)
    .eq('subject_id', subjectId)

  const completedIds = new Set(progressRows?.map((r) => r.lesson_id) ?? [])
  const allCompleted = lessons && lessons.length > 0 && lessons.every((l) => completedIds.has(l.id))

  const completedAt = new Date().toLocaleDateString('ar-BH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile as Profile} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Link href={`/subjects/${subjectId}`} className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> العودة للمادة
          </Link>
        </div>

        <div className="text-center mb-8">
          <Award size={48} className="mx-auto mb-3 text-yellow-400" />
          <h1 className="text-3xl font-black text-white mb-2">شهادة الإتمام</h1>
          {allCompleted ? (
            <p className="text-white/50">أكملت جميع دروس مادة <span className="text-purple-300 font-semibold">{subject.name}</span> — استحققت شهادتك!</p>
          ) : (
            <p className="text-yellow-400/80 text-sm">لم تكمل جميع الدروس بعد — أكمل باقي الدروس ثم عد هنا</p>
          )}
        </div>

        {allCompleted ? (
          <CertificateCanvas
            studentName={(profile as Profile)?.full_name ?? 'الطالب'}
            subjectName={subject.name}
            completedAt={completedAt}
          />
        ) : (
          <div className="text-center p-12 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
            <p className="text-white/50 mb-4">
              {completedIds.size}/{lessons?.length ?? 0} درس مكتمل
            </p>
            <Link
              href={`/subjects/${subjectId}`}
              className="inline-block px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
            >
              أكمل الدروس المتبقية
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
