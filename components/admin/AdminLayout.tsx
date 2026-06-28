'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import {
  LayoutDashboard, Users, BookOpen, Play, CreditCard, Upload, LogOut, HelpCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch initial pending count + subscribe to realtime updates
  useEffect(() => {
    async function fetchPending() {
      const { count } = await supabase
        .from('payment_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    }
    fetchPending()

    const channel = supabase
      .channel('admin-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () => {
        fetchPending()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const NAV = [
    { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
    { href: '/admin/payments', label: 'طلبات الدفع', icon: CreditCard, badge: pendingCount },
    { href: '/admin/students', label: 'الطلاب', icon: Users },
    { href: '/admin/subjects', label: 'المواد', icon: BookOpen },
    { href: '/admin/lessons', label: 'الدروس', icon: Play },
    { href: '/admin/quizzes', label: 'الاختبارات', icon: HelpCircle },
    { href: '/admin/ai-upload', label: 'رفع الكتب AI', icon: Upload },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#32004d' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-l border-white/10 flex flex-col" style={{ background: '#210340' }}>
        <div className="p-5 border-b border-white/10">
          <Logo size="sm" />
          <p className="text-white/40 text-xs mt-1">لوحة الإدارة</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'
                }`}
                style={active ? { background: '#500078' } : {}}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#dc2626', minWidth: '20px', textAlign: 'center' }}>
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={16} /> خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
