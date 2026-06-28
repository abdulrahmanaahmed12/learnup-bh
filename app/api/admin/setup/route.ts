import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!process.env.ADMIN_SETUP_CODE || code !== process.env.ADMIN_SETUP_CODE) {
    return NextResponse.json({ error: 'الكود غير صحيح' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
  }

  const service = await createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 })

  return NextResponse.json({ success: true })
}
