import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { BookOpen, Lock, CheckCircle, Phone, Search } from 'lucide-react'
import type { Profile, Subject } from '@/lib/types'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile} />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#500078' }} />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: '#6b009f' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-400/30 text-purple-300 text-sm font-medium mb-6" style={{ background: 'rgba(80,0,120,0.3)' }}>
            🎓 منصة تعليمية متخصصة في البحرين
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            تعلّم بطريقتك
            <span className="block" style={{ color: '#c084fc' }}>الصح</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            دروس فيديو احترافية، ملفات المنهج، ومساعد ذكي يجاوب أسئلتك من الكتاب المقرر — كل شيء في مكان واحد
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 rounded-xl text-white text-lg font-bold transition-all hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
            >
              ابدأ مجاناً الآن
            </Link>
            <Link
              href="/#subjects"
              className="px-8 py-4 rounded-xl text-white text-lg font-semibold border border-white/20 hover:border-white/40 transition-all hover:bg-white/5"
            >
              استعرض المواد
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> أول درس مجاني</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> بدون اشتراك شهري</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> مساعد ذكي 24/7</span>
            <Link href="/leaderboard" className="flex items-center gap-1.5 text-yellow-400/70 hover:text-yellow-400 transition-colors">
              🏆 المتصدرون
            </Link>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">المواد الدراسية</h2>
            <p className="text-white/50 mb-6">اختر المادة التي تريد التفوق فيها</p>
            {/* Search hint */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/30 text-sm">
              <Search size={14} />
              البحث في المواد متاح بعد تسجيل الدخول
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {subjects?.map((subject: Subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
            {(!subjects || subjects.length === 0) && (
              <div className="col-span-full text-center py-12 text-white/40">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p>المواد قادمة قريباً...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">كيف يعمل؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '١', title: 'سجّل حسابك', desc: 'أنشئ حساباً مجانياً بالاسم والإيميل في ثوانٍ', icon: '📝' },
              { step: '٢', title: 'اختر مادتك وادفع', desc: 'ادفع عبر BenefitPay أو PayPal وارفع الإيصال', icon: '💳' },
              { step: '٣', title: 'تعلّم بلا حدود', desc: 'شاهد الدروس، حمّل الملفات، واسأل الذكاء الاصطناعي', icon: '🚀' },
            ].map((item) => (
              <div key={item.step} className="relative text-center p-6 rounded-2xl border border-white/10" style={{ background: 'rgba(80,0,120,0.3)' }}>
                {/* Step badge — right corner for RTL */}
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#500078' }}>
                  {item.step}
                </div>
                <div className="text-4xl mb-4 mt-2">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">لماذا LearnUp.bh؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: '🎬', title: 'فيديوهات عالية الجودة', desc: 'دروس مسجّلة بشرح واضح ومبسّط، شاهدها في أي وقت' },
              { icon: '🤖', title: 'مساعد ذكي من الكتاب', desc: 'اسأل عن أي فصل والذكاء الاصطناعي يجاوبك من الكتاب المقرر مباشرة' },
              { icon: '📊', title: 'تتبع تقدّمك', desc: 'شاهد كم درساً أكملت، واحصل على شهادة عند إتمام المادة بالكامل' },
              { icon: '❓', title: 'اختبارات سريعة', desc: 'اختبر فهمك بعد كل درس بأسئلة اختيارية مع تصحيح فوري' },
              { icon: '📚', title: 'ملفات ومذكرات', desc: 'كتب PDF ومذكرات وتمارين محلولة لتحميل فوري' },
              { icon: '📝', title: 'ملاحظاتك الخاصة', desc: 'دوّن ملاحظاتك أثناء مشاهدة الدرس وتُحفظ تلقائياً' },
              { icon: '🏆', title: 'لوحة المتصدرين', desc: 'نافس زملاءك واحتل مراتب متقدمة بإكمال المزيد من الدروس' },
              { icon: '💬', title: 'تعليقات وتفاعل', desc: 'اطرح أسئلتك على المدرس تحت كل درس مباشرة' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl border border-white/10" style={{ background: 'rgba(80,0,120,0.25)' }}>
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-green-500/20" style={{ background: 'rgba(21,128,61,0.08)' }}>
            <div className="text-4xl">💬</div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="text-white font-bold text-lg mb-1">لديك سؤال؟</h3>
              <p className="text-white/50 text-sm">تواصل معنا مباشرة على واتساب ونجاوبك في أقل من ساعة</p>
            </div>
            <a
              href="https://wa.me/97338086464?text=مرحباً، أريد الاستفسار عن LearnUp.bh"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold border border-green-500/40 hover:bg-green-500/15 transition-all"
            >
              <Phone size={18} className="text-green-400" /> واتساب
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">تواصل معنا</h2>
          <p className="text-white/50 mb-8">أي استفسار أو مشكلة؟ نحن هنا دائماً</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://instagram.com/learnup.bh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white border border-white/20 hover:border-pink-400/50 hover:bg-pink-500/10 transition-all"
            >
              <span className="text-pink-400 font-bold text-lg">ig</span>
              @learnup.bh
            </a>
            <a
              href="https://wa.me/97338086464"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white border border-white/20 hover:border-green-400/50 hover:bg-green-500/10 transition-all"
            >
              <Phone size={20} className="text-green-400" />
              +973 3808 6464
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <p>© 2026 LearnUp.bh — جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="hover:text-white/60 transition-colors">المتصدرون</Link>
            <Link href="/auth/register" className="hover:text-white/60 transition-colors">التسجيل</Link>
            <Link href="/#contact" className="hover:text-white/60 transition-colors">تواصل</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link href={`/subjects/${subject.id}`} className="group block">
      <div
        className="p-5 rounded-2xl border border-white/10 transition-all duration-300 group-hover:border-purple-400/40 group-hover:scale-[1.02] group-hover:shadow-xl"
        style={{ background: '#500078' }}
      >
        <div className="text-4xl mb-4">{subject.icon || '📖'}</div>
        <h3 className="font-bold text-white text-lg mb-1">{subject.name}</h3>
        <p className="text-white/40 text-xs mb-3">{subject.name_en}</p>
        {subject.description && (
          <p className="text-white/50 text-sm mb-4 line-clamp-2">{subject.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {subject.level?.map((l) => (
              <span key={l} className="text-xs px-2 py-0.5 rounded-full text-purple-200" style={{ background: 'rgba(255,255,255,0.1)' }}>{l}</span>
            ))}
          </div>
          {subject.price ? (
            <span className="text-xs text-white/50 flex items-center gap-1">
              <Lock size={11} /> {subject.price} BD
            </span>
          ) : (
            <span className="text-xs text-white/30 flex items-center gap-1">
              <Lock size={11} /> اشترك
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
