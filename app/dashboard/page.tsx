import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { BookOpen, CreditCard, Bot, ChevronLeft, Trophy, Award } from 'lucide-react'
import type { Profile, Subject, PaymentRequest } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Subjects with access
  const { data: accessRows } = await supabase
    .from('student_access')
    .select('*, subjects(*)')
    .eq('student_id', user.id)

  // Payment requests
  const { data: payments } = await supabase
    .from('payment_requests')
    .select('*, subjects(name, icon)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Progress across all subjects
  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id, subject_id')
    .eq('student_id', user.id)

  const mySubjects = accessRows?.map((r) => r.subjects as Subject) ?? []
  const totalCompleted = progressRows?.length ?? 0

  // Leaderboard rank
  const { data: allProgress } = await supabase
    .from('lesson_progress')
    .select('student_id')
    .eq('completed', true)

  const rankMap: Record<string, number> = {}
  allProgress?.forEach((r) => { rankMap[r.student_id] = (rankMap[r.student_id] ?? 0) + 1 })
  const sorted = Object.entries(rankMap).sort((a, b) => b[1] - a[1])
  const myRank = sorted.findIndex(([id]) => id === user.id) + 1

  // Per-subject progress
  const subjectProgress: Record<string, number> = {}
  progressRows?.forEach((r) => {
    subjectProgress[r.subject_id] = (subjectProgress[r.subject_id] ?? 0) + 1
  })

  // Per-subject lesson counts
  const subjectLessonCounts: Record<string, number> = {}
  if (mySubjects.length > 0) {
    for (const s of mySubjects) {
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', s.id)
      subjectLessonCounts[s.id] = count ?? 0
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile as Profile} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">
              أهلاً، {profile?.full_name?.split(' ')[0] || 'طالب'} 👋
            </h1>
            <p className="text-white/50 mt-1">لوحة التحكم الخاصة بك</p>
          </div>
          {myRank > 0 && (
            <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-400/20 hover:bg-yellow-400/5 transition-all">
              <Trophy size={18} className="text-yellow-400" />
              <span className="text-yellow-300 text-sm font-bold">#{myRank}</span>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<BookOpen size={20} />} label="موادي" value={mySubjects.length} />
          <StatCard icon={<CreditCard size={20} />} label="طلبات الدفع" value={payments?.length ?? 0} />
          <StatCard icon={<Bot size={20} />} label="المساعد الذكي" value="متاح" />
          <StatCard icon={<Award size={20} />} label="دروس مكتملة" value={totalCompleted} />
        </div>

        {/* My Subjects */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">موادي</h2>
            <Link href="/" className="text-purple-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
              استعرض المزيد <ChevronLeft size={14} />
            </Link>
          </div>

          {mySubjects.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <BookOpen size={40} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/50 mb-4">لم تشترك في أي مادة بعد</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
              >
                استعرض المواد
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mySubjects.map((subject) => {
                const done = subjectProgress[subject.id] ?? 0
                const total = subjectLessonCounts[subject.id] ?? 0
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                const isFinished = total > 0 && done === total
                return (
                  <SubjectAccessCard
                    key={subject.id}
                    subject={subject}
                    completed={done}
                    total={total}
                    pct={pct}
                    isFinished={isFinished}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Payment requests */}
        {payments && payments.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-5">طلبات الدفع</h2>
            <div className="space-y-3">
              {payments.map((p: PaymentRequest & { subjects: Subject }) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
      <div className="flex items-center gap-2 text-purple-300 mb-2">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-white/50 text-sm mt-0.5">{label}</div>
    </div>
  )
}

function SubjectAccessCard({
  subject, completed, total, pct, isFinished
}: {
  subject: Subject
  completed: number
  total: number
  pct: number
  isFinished: boolean
}) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 transition-all hover:border-purple-400/30" style={{ background: '#500078' }}>
      <div className="flex items-start justify-between mb-1">
        <div className="text-3xl">{subject.icon || '📖'}</div>
        {isFinished && (
          <Link href={`/certificate/${subject.id}`} title="احصل على شهادتك">
            <Award size={18} className="text-yellow-400 hover:text-yellow-300 transition-colors" />
          </Link>
        )}
      </div>
      <h3 className="font-bold text-white mb-1">{subject.name}</h3>

      {total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>{completed}/{total} درس</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="h-1 rounded-full"
              style={{ width: `${pct}%`, background: isFinished ? '#16a34a' : 'linear-gradient(90deg, #500078, #6b009f)' }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/subjects/${subject.id}`}
          className="flex-1 text-center py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          {isFinished ? '✓ مكتمل' : 'الدروس'}
        </Link>
        <Link
          href={`/subjects/${subject.id}/ai`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white/70 hover:text-white border border-white/20 hover:border-white/40 text-sm transition-all"
        >
          <Bot size={14} />
        </Link>
      </div>
    </div>
  )
}

function PaymentRow({ payment }: { payment: PaymentRequest & { subjects: Subject } }) {
  const statusMap = {
    pending: { label: 'قيد المراجعة', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    approved: { label: 'مقبول ✓', color: 'text-green-400', bg: 'bg-green-400/10' },
    rejected: { label: 'مرفوض', color: 'text-red-400', bg: 'bg-red-400/10' },
  }
  const s = statusMap[payment.status]

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/10" style={{ background: '#500078' }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{(payment.subjects as Subject)?.icon || '📖'}</span>
        <div>
          <p className="text-white font-medium">{(payment.subjects as Subject)?.name}</p>
          <p className="text-white/40 text-xs">{payment.payment_method === 'benefitpay' ? 'BenefitPay' : 'PayPal'}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color} ${s.bg}`}>
        {s.label}
      </span>
    </div>
  )
}
