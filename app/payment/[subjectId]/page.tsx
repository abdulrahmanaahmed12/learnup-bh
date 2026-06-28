import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PaymentForm from '@/components/payment/PaymentForm'
import type { Profile } from '@/lib/types'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function PaymentPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: subject }, { data: existingAccess }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase.from('student_access').select('id').eq('student_id', user.id).eq('subject_id', subjectId).maybeSingle(),
  ])

  if (!subject) notFound()
  if (existingAccess) redirect(`/subjects/${subjectId}`)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile as Profile} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{subject.icon}</div>
          <h1 className="text-2xl font-bold text-white">الاشتراك في {subject.name}</h1>
          {subject.price && (
            <p className="text-3xl font-black mt-2" style={{ color: '#c084fc' }}>{subject.price} BD</p>
          )}
        </div>
        <PaymentForm subject={subject} userId={user.id} />
      </main>
    </div>
  )
}
