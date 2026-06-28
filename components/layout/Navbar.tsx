'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import { Menu, X, LogOut, User, LayoutDashboard, Shield } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface NavbarProps {
  profile?: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10" style={{ background: 'rgba(50,0,77,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#subjects" className="text-white/70 hover:text-white transition-colors text-sm font-medium">المواد</Link>
          <Link href="/#how" className="text-white/70 hover:text-white transition-colors text-sm font-medium">كيف يعمل</Link>
          <Link href="/#contact" className="text-white/70 hover:text-white transition-colors text-sm font-medium">تواصل معنا</Link>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-3">
              {profile.role === 'admin' && (
                <Link href="/admin" className="flex items-center gap-1.5 text-sm text-purple-300 hover:text-white transition-colors">
                  <Shield size={15} />
                  الإدارة
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
                <LayoutDashboard size={15} />
                لوحتي
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 text-sm">
                <User size={14} className="text-purple-300" />
                <span className="text-white/80">{profile.full_name?.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-white/50 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} />
                خروج
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3" style={{ background: '#32004d' }}>
          <Link href="/#subjects" className="block text-white/70 hover:text-white py-2" onClick={() => setOpen(false)}>المواد</Link>
          <Link href="/#how" className="block text-white/70 hover:text-white py-2" onClick={() => setOpen(false)}>كيف يعمل</Link>
          <Link href="/#contact" className="block text-white/70 hover:text-white py-2" onClick={() => setOpen(false)}>تواصل معنا</Link>
          <div className="border-t border-white/10 pt-3 space-y-2">
            {profile ? (
              <>
                <Link href="/dashboard" className="block text-white py-2" onClick={() => setOpen(false)}>لوحتي</Link>
                {profile.role === 'admin' && (
                  <Link href="/admin" className="block text-purple-300 py-2" onClick={() => setOpen(false)}>الإدارة</Link>
                )}
                <button onClick={handleLogout} className="block text-red-400 py-2 w-full text-right">تسجيل الخروج</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block text-white py-2" onClick={() => setOpen(false)}>تسجيل الدخول</Link>
                <Link href="/auth/register" className="block text-purple-300 py-2 font-semibold" onClick={() => setOpen(false)}>إنشاء حساب</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
