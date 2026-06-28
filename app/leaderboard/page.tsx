import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Trophy, Medal, ChevronLeft } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Count completed lessons per student
  const { data: rawProgress } = await supabase
    .from('lesson_progress')
    .select('student_id, profiles(full_name)')
    .eq('completed', true)

  // Aggregate by student
  const countMap: Record<string, { name: string; count: number }> = {}
  rawProgress?.forEach((row) => {
    const sid = row.student_id
    const profileData = row.profiles as unknown as { full_name: string | null } | null
    const name = profileData?.full_name ?? 'طالب'
    if (!countMap[sid]) countMap[sid] = { name, count: 0 }
    countMap[sid].count++
  })

  const leaderboard = Object.entries(countMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  const myRank = user ? leaderboard.findIndex((e) => e.id === user.id) + 1 : 0

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile} />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> لوحة التحكم
          </Link>
        </div>

        <div className="text-center mb-10">
          <Trophy size={48} className="mx-auto mb-3 text-yellow-400" />
          <h1 className="text-3xl font-black text-white mb-2">المتصدرون</h1>
          <p className="text-white/50">أكثر الطلاب إنجازاً لهذا الشهر</p>
        </div>

        {/* My rank */}
        {user && myRank > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-purple-400/30 flex items-center gap-4" style={{ background: 'rgba(80,0,120,0.4)' }}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center font-black text-white">
              #{myRank}
            </div>
            <div>
              <p className="text-white font-semibold">مرتبتك الحالية</p>
              <p className="text-white/50 text-sm">{leaderboard[myRank - 1]?.count ?? 0} درس مكتمل</p>
            </div>
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Medal size={48} className="mx-auto mb-4 opacity-30" />
            <p>لا يوجد بيانات بعد — ابدأ إكمال الدروس لتظهر هنا!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.id === user?.id
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isMe ? 'border-purple-400/50' : 'border-white/10'
                  }`}
                  style={{ background: isMe ? 'rgba(80,0,120,0.5)' : '#500078' }}
                >
                  <div className="w-10 text-center font-black text-lg shrink-0">
                    {idx < 3 ? medals[idx] : <span className="text-white/40 text-sm">#{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isMe ? 'text-purple-300' : 'text-white'}`}>
                      {/* Show first name only for privacy */}
                      {entry.name.split(' ')[0]}
                      {isMe && <span className="text-xs text-white/50 mr-2">(أنت)</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <span className="text-white font-black">{entry.count}</span>
                    <span className="text-white/40 text-xs mr-1">درس</span>
                  </div>
                  {idx === 0 && (
                    <div className="shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full text-yellow-300 font-semibold" style={{ background: 'rgba(234,179,8,0.15)' }}>
                        متصدر
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-8">
          يُحدَّث الترتيب بناءً على الدروس المكتملة
        </p>
      </main>
    </div>
  )
}
