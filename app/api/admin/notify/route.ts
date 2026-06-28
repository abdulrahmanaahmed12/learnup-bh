import { createClient } from '@/lib/supabase/server'
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/email'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { type, paymentId, reason } = await req.json()

  const { data: payment } = await supabase
    .from('payment_requests')
    .select('*, profiles(full_name, email), subjects(name)')
    .eq('id', paymentId)
    .single()

  if (!payment) return Response.json({ error: 'Not found' }, { status: 404 })

  const studentEmail = (payment.profiles as { full_name: string; email: string })?.email
  const studentName = (payment.profiles as { full_name: string; email: string })?.full_name
  const subjectName = (payment.subjects as { name: string })?.name

  try {
    if (type === 'approved') {
      await sendPaymentApprovedEmail(studentEmail, studentName, subjectName)
    } else {
      await sendPaymentRejectedEmail(studentEmail, studentName, subjectName, reason ?? '')
    }
  } catch {
    // Email is non-critical
  }

  return Response.json({ ok: true })
}
