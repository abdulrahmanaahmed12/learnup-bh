import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { lesson_id, subject_id } = await request.json()
  if (!lesson_id || !subject_id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const { error } = await supabase.from('lesson_progress').upsert(
    { student_id: user.id, lesson_id, subject_id, completed: true, completed_at: new Date().toISOString() },
    { onConflict: 'student_id,lesson_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { lesson_id } = await request.json()
  await supabase.from('lesson_progress').delete().eq('student_id', user.id).eq('lesson_id', lesson_id)
  return NextResponse.json({ success: true })
}
