'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import type { Subject } from '@/lib/types'

const EMPTY: Partial<Subject> = { name: '', name_en: '', description: '', icon: '', level: [], price: undefined, paypal_email: '' }

export default function SubjectsAdminPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<Partial<Subject>>(EMPTY)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchSubjects = useCallback(async () => {
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    setSubjects(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchSubjects() }, [fetchSubjects])

  function startEdit(s: Subject | null) {
    setEditingId(s ? s.id : 'new')
    setForm(s ? { ...s } : EMPTY)
    setQrFile(null)
  }

  async function save() {
    setSaving(true)
    let qrUrl = form.benefitpay_qr_url

    if (qrFile) {
      const path = `qr/${form.name_en?.toLowerCase()}-${Date.now()}.png`
      await supabase.storage.from('public').upload(path, qrFile, { upsert: true })
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(path)
      qrUrl = urlData.publicUrl
    }

    const payload = { ...form, benefitpay_qr_url: qrUrl }

    if (editingId === 'new') {
      await supabase.from('subjects').insert(payload)
    } else {
      await supabase.from('subjects').update(payload).eq('id', editingId!)
    }

    setSaving(false)
    setEditingId(null)
    fetchSubjects()
  }

  async function deleteSubject(id: string) {
    if (!confirm('حذف هذه المادة نهائياً؟')) return
    await supabase.from('subjects').delete().eq('id', id)
    fetchSubjects()
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">المواد الدراسية</h1>
        <button
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          <Plus size={16} /> إضافة مادة
        </button>
      </div>

      {/* Add/Edit form */}
      {editingId && (
        <div className="mb-6 p-6 rounded-2xl border border-purple-400/30" style={{ background: '#210340' }}>
          <h2 className="text-white font-bold mb-4">{editingId === 'new' ? 'إضافة مادة جديدة' : 'تعديل المادة'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'اسم المادة (عربي)', key: 'name' },
              { label: 'اسم المادة (إنجليزي)', key: 'name_en' },
              { label: 'إيموجي', key: 'icon' },
              { label: 'السعر (BD)', key: 'price', type: 'number' },
              { label: 'إيميل PayPal', key: 'paypal_email' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm text-white/60 mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={(form[key as keyof Subject] as string) ?? ''}
                  onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-white border border-white/20 outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-sm text-white/60 mb-1">الوصف</label>
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-white border border-white/20 outline-none text-sm resize-none"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">صورة BenefitPay QR</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:text-white file:cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '8px' }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
            >
              <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white border border-white/20 transition-colors"
            >
              <X size={15} /> إلغاء
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{s.icon}</span>
                  <div>
                    <h3 className="text-white font-bold">{s.name}</h3>
                    <p className="text-white/40 text-sm">{s.name_en}</p>
                    {s.price && <p className="text-purple-300 font-semibold text-sm mt-0.5">{s.price} BD</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteSubject(s.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
