import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const lesson_id = request.nextUrl.searchParams.get('lesson_id')
  if (!lesson_id) return NextResponse.json({ note: null })

  const { data } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('student_id', user.id)
    .eq('lesson_id', lesson_id)
    .maybeSingle()

  return NextResponse.json({ note: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { lesson_id, content } = await request.json()
  if (!lesson_id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const { error } = await supabase.from('lesson_notes').upsert(
    { student_id: user.id, lesson_id, content: content ?? '', updated_at: new Date().toISOString() },
    { onConflict: 'student_id,lesson_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
