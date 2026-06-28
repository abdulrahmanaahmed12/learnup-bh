import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#32004d' }}>
      <div className="w-full max-w-md text-center p-8 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-3">تم التحقق بنجاح!</h2>
        <p className="text-white/60 mb-6">تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.</p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  )
}
