'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('الرجاء إدخال الاسم الكامل')
    if (!email.includes('@')) return setError('البريد الإلكتروني غير صحيح')
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين')

    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً')
      } else {
        setError('حدث خطأ، حاول مرة أخرى')
      }
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#32004d' }}>
        <div className="w-full max-w-md text-center p-8 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white mb-3">تحقق من بريدك</h2>
          <p className="text-white/60 mb-6">أرسلنا لك رابط التحقق على <strong className="text-white">{email}</strong></p>
          <Link href="/auth/login" className="text-purple-300 hover:text-white transition-colors">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#32004d' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="text-white/50 mt-1">انضم لآلاف الطلاب في البحرين</p>
        </div>

        <div className="p-7 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="محمد أحمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
              placeholder="8 أحرف على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="أعد كتابة كلمة المرور"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
                {error}
              </div>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              إنشاء الحساب
            </Button>
          </form>
        </div>

        <p className="text-center text-white/50 mt-6 text-sm">
          لديك حساب؟{' '}
          <Link href="/auth/login" className="text-purple-300 hover:text-white transition-colors font-medium">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
