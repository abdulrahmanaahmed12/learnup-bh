'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { ShieldCheck } from 'lucide-react'

export default function AdminSetupPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/admin'), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#32004d' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <div className="flex items-center justify-center gap-2 text-purple-300 mb-2">
            <ShieldCheck size={20} />
            <span className="font-semibold">تفعيل حساب الأدمن</span>
          </div>
          <p className="text-white/40 text-sm">أدخل الكود السري لترقية حسابك إلى أدمن</p>
        </div>

        {success ? (
          <div className="text-center p-6 rounded-2xl border border-green-500/30" style={{ background: 'rgba(22,163,74,0.1)' }}>
            <p className="text-green-400 font-bold text-lg mb-1">✓ تم بنجاح!</p>
            <p className="text-white/50 text-sm">جاري التحويل للوحة الإدارة...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/10 space-y-4" style={{ background: '#500078' }}>
              <div>
                <label className="block text-sm text-white/60 mb-2">الكود السري</label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل الكود هنا..."
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-center text-lg tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/20 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code}
                className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
              >
                {loading ? 'جاري التحقق...' : 'تفعيل الأدمن'}
              </button>
            </div>

            <p className="text-center text-white/20 text-xs">
              هذه الصفحة للاستخدام الداخلي فقط
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
