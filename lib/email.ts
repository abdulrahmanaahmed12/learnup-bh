import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LearnUp.bh <noreply@learnup.bh>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

export async function sendPaymentReceivedEmail(
  adminEmail: string,
  studentName: string,
  subjectName: string,
  method: string
) {
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `طلب دفع جديد - ${subjectName}`,
    html: `
      <div dir="rtl" style="font-family: Arial; background:#32004d; color:#fff; padding:24px; border-radius:12px;">
        <h2>طلب دفع جديد 💰</h2>
        <p>الطالب: <strong>${studentName}</strong></p>
        <p>المادة: <strong>${subjectName}</strong></p>
        <p>طريقة الدفع: <strong>${method === 'benefitpay' ? 'BenefitPay' : 'PayPal'}</strong></p>
        <p>يرجى مراجعة لوحة الإدارة للموافقة أو الرفض.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/payments"
           style="background:#500078;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">
          مراجعة الطلب
        </a>
      </div>
    `,
  })
}

export async function sendPaymentApprovedEmail(
  studentEmail: string,
  studentName: string,
  subjectName: string
) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: `تم تفعيل اشتراكك في ${subjectName} ✅`,
    html: `
      <div dir="rtl" style="font-family: Arial; background:#32004d; color:#fff; padding:24px; border-radius:12px;">
        <h2>تم تفعيل اشتراكك! 🎉</h2>
        <p>أهلاً ${studentName}،</p>
        <p>تم الموافقة على طلبك وتفعيل وصولك لمادة <strong>${subjectName}</strong>.</p>
        <p>يمكنك الآن الوصول إلى جميع الدروس والملفات والمساعد الذكي.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
           style="background:#500078;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">
          ابدأ التعلم الآن
        </a>
      </div>
    `,
  })
}

export async function sendPaymentRejectedEmail(
  studentEmail: string,
  studentName: string,
  subjectName: string,
  reason: string
) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: `بخصوص طلب الاشتراك في ${subjectName}`,
    html: `
      <div dir="rtl" style="font-family: Arial; background:#32004d; color:#fff; padding:24px; border-radius:12px;">
        <h2>تحديث على طلبك</h2>
        <p>أهلاً ${studentName}،</p>
        <p>للأسف لم نتمكن من الموافقة على طلبك لمادة <strong>${subjectName}</strong>.</p>
        ${reason ? `<p>السبب: ${reason}</p>` : ''}
        <p>إذا كان لديك أي استفسار تواصل معنا على إنستجرام: @learnup.bh</p>
      </div>
    `,
  })
}

export { ADMIN_EMAIL }
