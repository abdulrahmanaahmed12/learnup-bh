'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      if (authError.message.includes('Invalid login')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('يرجى تأكيد بريدك الإلكتروني أولاً')
      } else {
        setError('حدث خطأ، حاول مرة أخرى')
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#32004d' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <h1 className="text-2xl font-bold text-white">مرحباً بعودتك</h1>
          <p className="text-white/50 mt-1">سجّل دخولك للوصول إلى مواد التعلم</p>
        </div>

        <div className="p-7 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
                {error}
              </div>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              تسجيل الدخول
            </Button>
          </form>
        </div>

        <p className="text-center text-white/50 mt-6 text-sm">
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" className="text-purple-300 hover:text-white transition-colors font-medium">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  )
}
