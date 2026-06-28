'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PaymentRequest, Subject, Profile } from '@/lib/types'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<(PaymentRequest & { profiles: Profile; subjects: Subject })[]>([])
  const [filter, setFilter] = useState<Filter>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('payment_requests')
      .select('*, profiles(full_name, email), subjects(name, icon)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setPayments((data as (PaymentRequest & { profiles: Profile; subjects: Subject })[]) || [])
    setLoading(false)
  }, [filter, supabase])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function approve(payment: PaymentRequest & { profiles: Profile; subjects: Subject }) {
    setProcessing(payment.id)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('payment_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', payment.id)

    await supabase.from('student_access').insert({
      student_id: payment.student_id,
      subject_id: payment.subject_id,
      granted_by: user?.id,
    })

    await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'approved', paymentId: payment.id }),
    })

    await fetchPayments()
    setProcessing(null)
  }

  async function reject(payment: PaymentRequest) {
    setProcessing(payment.id)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('payment_requests').update({
      status: 'rejected',
      notes: rejectReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', payment.id)

    await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rejected', paymentId: payment.id, reason: rejectReason }),
    })

    setRejectingId(null)
    setRejectReason('')
    await fetchPayments()
    setProcessing(null)
  }

  const filters: Filter[] = ['all', 'pending', 'approved', 'rejected']
  const filterLabels: Record<Filter, string> = { all: 'الكل', pending: 'معلق', approved: 'مقبول', rejected: 'مرفوض' }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">طلبات الدفع</h1>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={filter === f ? { background: '#500078' } : {}}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl skeleton" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Filter size={40} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{p.profiles?.full_name}</span>
                    <span className="text-white/40 text-sm">{p.profiles?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <span>{(p.subjects as Subject)?.icon} {(p.subjects as Subject)?.name}</span>
                    <span>•</span>
                    <span>{p.payment_method === 'benefitpay' ? 'BenefitPay' : 'PayPal'}</span>
                    {p.amount && <><span>•</span><span className="font-semibold text-white">{p.amount} BD</span></>}
                    <span>•</span>
                    <span>{formatDate(p.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.screenshot_url && (
                    <a
                      href={p.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white border border-white/20 hover:border-white/40 transition-all"
                    >
                      <Eye size={14} /> الإيصال
                    </a>
                  )}
                  {p.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(p)}
                        disabled={processing === p.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-green-300 hover:text-white bg-green-500/15 hover:bg-green-500/25 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> قبول
                      </button>
                      <button
                        onClick={() => setRejectingId(p.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-300 hover:text-white bg-red-500/15 hover:bg-red-500/25 transition-all"
                      >
                        <XCircle size={14} /> رفض
                      </button>
                    </>
                  )}
                  {p.status !== 'pending' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'approved' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {p.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </span>
                  )}
                </div>
              </div>

              {/* Reject form */}
              {rejectingId === p.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="سبب الرفض (اختياري)"
                    className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(p)}
                      disabled={processing === p.id}
                      className="px-4 py-2 rounded-xl text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      تأكيد الرفض
                    </button>
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white border border-white/20 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
