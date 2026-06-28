import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChatInterface from '@/components/chat/ChatInterface'
import type { Profile } from '@/lib/types'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function AIPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: subject }, { data: access }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase.from('student_access').select('id').eq('student_id', user.id).eq('subject_id', subjectId).maybeSingle(),
  ])

  if (!access) redirect(`/subjects/${subjectId}`)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile as Profile} />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{subject?.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-white">المساعد الذكي</h1>
            <p className="text-white/50 text-sm">مادة {subject?.name}</p>
          </div>
        </div>
        <ChatInterface subjectId={subjectId} subjectName={subject?.name ?? ''} />
      </div>
    </div>
  )
}
