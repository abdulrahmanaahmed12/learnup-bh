import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { Users, BookOpen, CreditCard } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [
    { count: pendingCount },
    { count: studentsCount },
    { count: subjectsCount },
  ] = await Promise.all([
    supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const { data: recentPayments } = await supabase
    .from('payment_requests')
    .select('*, profiles(full_name), subjects(name, icon)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-8">نظرة عامة</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard icon={<CreditCard size={20} />} label="طلبات معلقة" value={pendingCount ?? 0} highlight={!!pendingCount} />
        <StatCard icon={<Users size={20} />} label="إجمالي الطلاب" value={studentsCount ?? 0} />
        <StatCard icon={<BookOpen size={20} />} label="المواد النشطة" value={subjectsCount ?? 0} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">آخر طلبات الدفع</h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#500078' }}>
          {recentPayments?.length === 0 ? (
            <p className="text-center text-white/40 py-8">لا توجد طلبات بعد</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-white/50">
                  <th className="text-right p-4">الطالب</th>
                  <th className="text-right p-4">المادة</th>
                  <th className="text-right p-4">الطريقة</th>
                  <th className="text-right p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentPayments?.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white">{(p.profiles as { full_name: string })?.full_name}</td>
                    <td className="p-4 text-white/70">{(p.subjects as { icon: string; name: string })?.icon} {(p.subjects as { icon: string; name: string })?.name}</td>
                    <td className="p-4 text-white/70">{p.payment_method === 'benefitpay' ? 'BenefitPay' : 'PayPal'}</td>
                    <td className="p-4">
                      <StatusBadge status={p.status as 'pending' | 'approved' | 'rejected'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="p-6 rounded-2xl border transition-all"
      style={{
        background: highlight ? 'rgba(234,179,8,0.15)' : '#500078',
        borderColor: highlight ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <div className={highlight ? 'text-yellow-400' : 'text-purple-300'}>{icon}</div>
      <div className="text-3xl font-black text-white mt-2">{value}</div>
      <div className="text-white/50 text-sm mt-0.5">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const map = {
    pending: { label: 'معلق', className: 'text-yellow-400 bg-yellow-400/10' },
    approved: { label: 'مقبول', className: 'text-green-400 bg-green-400/10' },
    rejected: { label: 'مرفوض', className: 'text-red-400 bg-red-400/10' },
  }
  const s = map[status]
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>
  )
}
