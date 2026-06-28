import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { BookOpen, CreditCard, Bot, ChevronLeft } from 'lucide-react'
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

  // Pending payments
  const { data: payments } = await supabase
    .from('payment_requests')
    .select('*, subjects(name, icon)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const mySubjects = accessRows?.map((r) => r.subjects as Subject) ?? []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile as Profile} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">
            أهلاً، {profile?.full_name?.split(' ')[0] || 'طالب'} 👋
          </h1>
          <p className="text-white/50 mt-1">لوحة التحكم الخاصة بك</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <StatCard icon={<BookOpen size={20} />} label="موادي" value={mySubjects.length} />
          <StatCard icon={<CreditCard size={20} />} label="طلبات الدفع" value={payments?.length ?? 0} />
          <StatCard icon={<Bot size={20} />} label="المساعد الذكي" value="متاح" />
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
              {mySubjects.map((subject) => (
                <SubjectAccessCard key={subject.id} subject={subject} />
              ))}
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

function SubjectAccessCard({ subject }: { subject: Subject }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 transition-all hover:border-purple-400/30" style={{ background: '#500078' }}>
      <div className="text-3xl mb-3">{subject.icon || '📖'}</div>
      <h3 className="font-bold text-white mb-1">{subject.name}</h3>
      <div className="flex gap-2 mt-4">
        <Link
          href={`/subjects/${subject.id}`}
          className="flex-1 text-center py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          الدروس
        </Link>
        <Link
          href={`/subjects/${subject.id}/ai`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white/70 hover:text-white border border-white/20 hover:border-white/40 text-sm transition-all"
        >
          <Bot size={14} />
          AI
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
