import { createClient } from '@/lib/supabase/server'
import { sendPaymentReceivedEmail, ADMIN_EMAIL } from '@/lib/email'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectName, method } = await req.json()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  try {
    await sendPaymentReceivedEmail(ADMIN_EMAIL, profile?.full_name ?? 'طالب', subjectName, method)
  } catch {
    // Non-critical; don't fail the request
  }

  return Response.json({ ok: true })
}
