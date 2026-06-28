'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, X, ChevronUp, ChevronDown, Upload } from 'lucide-react'
import type { Subject, Lesson, SubjectFile } from '@/lib/types'

const EMPTY_LESSON = { title: '', description: '', youtube_url: '', order_index: 0, is_free: false, duration: '' }

export default function LessonsAdminPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [files, setFiles] = useState<SubjectFile[]>([])
  const [addingLesson, setAddingLesson] = useState(false)
  const [form, setForm] = useState(EMPTY_LESSON)
  const [saving, setSaving] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState<'book' | 'notes' | 'exercises'>('book')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!selectedSubject) return
    const [{ data: ls }, { data: fs }] = await Promise.all([
      supabase.from('lessons').select('*').eq('subject_id', selectedSubject).order('order_index'),
      supabase.from('subject_files').select('*').eq('subject_id', selectedSubject).order('created_at'),
    ])
    setLessons(ls || [])
    setFiles(fs || [])
  }, [selectedSubject, supabase])

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).then(({ data }) => setSubjects(data || []))
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveLesson() {
    if (!form.title || !form.youtube_url || !selectedSubject) return
    setSaving(true)
    await supabase.from('lessons').insert({ ...form, subject_id: selectedSubject })
    setSaving(false)
    setAddingLesson(false)
    setForm(EMPTY_LESSON)
    fetchData()
  }

  async function deleteLesson(id: string) {
    if (!confirm('حذف هذا الدرس؟')) return
    await supabase.from('lessons').delete().eq('id', id)
    fetchData()
  }

  async function moveLesson(lesson: Lesson, dir: 'up' | 'down') {
    const idx = lessons.findIndex((l) => l.id === lesson.id)
    const swap = lessons[dir === 'up' ? idx - 1 : idx + 1]
    if (!swap) return
    await Promise.all([
      supabase.from('lessons').update({ order_index: swap.order_index }).eq('id', lesson.id),
      supabase.from('lessons').update({ order_index: lesson.order_index }).eq('id', swap.id),
    ])
    fetchData()
  }

  async function uploadSubjectFile() {
    if (!uploadFile || !uploadName || !selectedSubject) return
    setUploading(true)
    const ext = uploadFile.name.split('.').pop()
    const path = `subject-files/${selectedSubject}/${Date.now()}.${ext}`
    await supabase.storage.from('files').upload(path, uploadFile, { upsert: true })
    const { data: urlData } = supabase.storage.from('files').getPublicUrl(path)
    await supabase.from('subject_files').insert({
      subject_id: selectedSubject,
      name: uploadName,
      file_url: urlData.publicUrl,
      file_type: uploadType,
    })
    setUploadFile(null)
    setUploadName('')
    setUploading(false)
    fetchData()
  }

  async function deleteFile(id: string) {
    await supabase.from('subject_files').delete().eq('id', id)
    fetchData()
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-8">الدروس والملفات</h1>

      {/* Subject selector */}
      <div className="mb-6">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-3 rounded-xl text-white border border-white/20 outline-none text-sm min-w-[200px]"
          style={{ background: '#500078' }}
        >
          <option value="">اختر المادة</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      {selectedSubject && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">الدروس ({lessons.length})</h2>
              <button
                onClick={() => setAddingLesson(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
              >
                <Plus size={14} /> إضافة درس
              </button>
            </div>

            {addingLesson && (
              <div className="mb-4 p-4 rounded-xl border border-purple-400/30 space-y-3" style={{ background: '#210340' }}>
                {[
                  { label: 'عنوان الدرس', key: 'title' },
                  { label: 'رابط YouTube', key: 'youtube_url' },
                  { label: 'الوصف (اختياري)', key: 'description' },
                  { label: 'المدة (مثال: 45:00)', key: 'duration' },
                  { label: 'الترتيب', key: 'order_index', type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-white/50 mb-1">{label}</label>
                    <input
                      type={type || 'text'}
                      value={(form[key as keyof typeof form] as string) ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    />
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} />
                  درس مجاني (بريفيو)
                </label>
                <div className="flex gap-2">
                  <button onClick={saveLesson} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50 hover:opacity-90" style={{ background: '#500078' }}>
                    <Save size={13} /> حفظ
                  </button>
                  <button onClick={() => setAddingLesson(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/20">
                    <X size={13} /> إلغاء
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10" style={{ background: '#500078' }}>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveLesson(lesson, 'up')} disabled={idx === 0} className="p-0.5 text-white/30 hover:text-white disabled:opacity-20"><ChevronUp size={14} /></button>
                    <button onClick={() => moveLesson(lesson, 'down')} disabled={idx === lessons.length - 1} className="p-0.5 text-white/30 hover:text-white disabled:opacity-20"><ChevronDown size={14} /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{lesson.title}</p>
                    <div className="flex gap-2 text-xs text-white/40 mt-0.5">
                      {lesson.is_free && <span className="text-green-400">مجاني</span>}
                      {lesson.duration && <span>{lesson.duration}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Files */}
          <div>
            <h2 className="text-white font-bold mb-4">الملفات والكتب ({files.length})</h2>

            <div className="p-4 rounded-xl border border-white/10 space-y-3 mb-4" style={{ background: '#210340' }}>
              <input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="اسم الملف"
                className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as 'book' | 'notes' | 'exercises')}
                className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <option value="book">كتاب</option>
                <option value="notes">مذكرات</option>
                <option value="exercises">تمارين</option>
              </select>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400/50 cursor-pointer text-sm text-white/50">
                <Upload size={16} /> {uploadFile ? uploadFile.name : 'اختر ملف PDF'}
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              </label>
              <button
                onClick={uploadSubjectFile}
                disabled={uploading || !uploadFile || !uploadName}
                className="w-full py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-40 hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
              >
                {uploading ? 'جاري الرفع...' : 'رفع الملف'}
              </button>
            </div>

            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10" style={{ background: '#500078' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{f.name}</p>
                    <p className="text-white/40 text-xs">{f.file_type}</p>
                  </div>
                  <button onClick={() => deleteFile(f.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
