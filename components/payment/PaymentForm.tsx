'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Subject } from '@/lib/types'

interface Props {
  subject: Subject
  userId: string
}

type Method = 'benefitpay' | 'paypal'

export default function PaymentForm({ subject, userId }: Props) {
  const [method, setMethod] = useState<Method>('benefitpay')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setError('يرجى رفع صورة إيصال الدفع')
    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `payment-screenshots/${userId}/${subject.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('payments')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('فشل رفع الصورة. تحقق من حجم الملف (أقل من 5MB)')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('payments').getPublicUrl(path)

    const { error: dbError } = await supabase.from('payment_requests').insert({
      student_id: userId,
      subject_id: subject.id,
      amount: subject.price,
      payment_method: method,
      screenshot_url: urlData.publicUrl,
      status: 'pending',
    })

    setUploading(false)
    if (dbError) {
      setError('حدث خطأ، حاول مرة أخرى')
    } else {
      // Notify admin via API
      await fetch('/api/payment/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName: subject.name, method }),
      })
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="text-center p-10 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
        <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
        <h2 className="text-xl font-bold text-white mb-3">تم إرسال طلبك!</h2>
        <p className="text-white/60 mb-5">سيتم مراجعته خلال 24 ساعة وستصلك رسالة بريد إلكتروني عند الموافقة.</p>
        <a
          href="https://wa.me/97338086464?text=أرسلت طلب دفع، هل يمكنك التأكيد؟"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-sm"
        >
          💬 تتبع طلبك عبر واتساب
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Method tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/20 mb-6">
        {(['benefitpay', 'paypal'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex-1 py-3 font-semibold text-sm transition-all ${method === m ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            style={method === m ? { background: 'linear-gradient(135deg, #500078, #6b009f)' } : { background: '#32004d' }}
          >
            {m === 'benefitpay' ? '🏦 BenefitPay' : '💳 PayPal'}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-white/10 space-y-5" style={{ background: '#500078' }}>
        {method === 'benefitpay' ? (
          <div className="space-y-4">
            {subject.benefitpay_qr_url ? (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-3">امسح رمز QR لإتمام الدفع</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={subject.benefitpay_qr_url}
                  alt="BenefitPay QR"
                  className="mx-auto w-48 h-48 object-contain rounded-xl"
                  style={{ background: 'white', padding: '8px' }}
                />
              </div>
            ) : (
              <a
                href="https://wa.me/97338086464?text=أريد الدفع عبر BenefitPay للاشتراك في المادة"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-sm font-semibold"
              >
                💬 تواصل معنا على واتساب لتفاصيل الدفع
              </a>
            )}
            <div className="p-4 rounded-xl text-sm text-white/70 space-y-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p>1. افتح تطبيق BenefitPay</p>
              <p>2. امسح رمز QR أعلاه</p>
              <p className="font-semibold text-white">3. ادفع مبلغ {subject.price ?? '—'} BD</p>
              <p>4. خذ لقطة شاشة للإيصال وارفعها أدناه</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {subject.paypal_email && (
              <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-white/50 text-sm mb-1">أرسل الدفعة إلى</p>
                <p className="text-white font-bold text-lg">{subject.paypal_email}</p>
              </div>
            )}
            <div className="p-4 rounded-xl text-sm text-white/70 space-y-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p>1. افتح PayPal وأرسل الدفعة للعنوان أعلاه</p>
              <p className="font-semibold text-white">2. المبلغ: {subject.price ?? '—'} BD</p>
              <p>3. خذ لقطة شاشة وارفعها أدناه</p>
            </div>
          </div>
        )}

        {/* Screenshot upload */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">صورة إيصال الدفع</label>
          <label
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Upload size={28} className={file ? 'text-green-400' : 'text-white/30'} />
            <span className="text-sm text-white/50">
              {file ? file.name : 'اضغط لرفع الصورة (PNG, JPG)'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={uploading} className="w-full">
          إرسال طلب الاشتراك
        </Button>
      </div>
    </form>
  )
}
