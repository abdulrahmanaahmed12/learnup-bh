'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import type { Subject } from '@/lib/types'

interface UploadStatus {
  step: string
  progress: number
  done: boolean
  error?: string
}

export default function AIUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus | null>(null)
  const [uploadedBooks, setUploadedBooks] = useState<Array<{ subject_id: string; metadata: { file_name: string } }>>([])
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).then(({ data }) => setSubjects(data || []))
    fetchBooks()
  }, [])

  async function fetchBooks() {
    const { data } = await supabase
      .from('documents')
      .select('subject_id, metadata')
      .not('metadata->file_name', 'is', null)
    // Deduplicate by file_name
    const seen = new Set()
    const unique = (data || []).filter((d) => {
      const key = `${d.subject_id}-${(d.metadata as { file_name: string })?.file_name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    setUploadedBooks(unique as Array<{ subject_id: string; metadata: { file_name: string } }>)
  }

  async function handleUpload() {
    if (!file || !selectedSubject) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subjectId', selectedSubject)

    setStatus({ step: 'جاري رفع الملف...', progress: 10, done: false })

    try {
      const res = await fetch('/api/upload-book', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        setStatus({ step: 'فشل', progress: 0, done: false, error: err.error })
        return
      }

      // Stream progress
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const update = JSON.parse(line)
            setStatus(update)
          } catch {}
        }
      }

      fetchBooks()
    } catch {
      setStatus({ step: 'فشل الاتصال', progress: 0, done: false, error: 'تحقق من اتصالك وحاول مرة أخرى' })
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-8">رفع كتب للمساعد الذكي</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="p-6 rounded-2xl border border-white/10 space-y-4" style={{ background: '#500078' }}>
            <div>
              <label className="block text-sm text-white/60 mb-2">اختر المادة</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white border border-white/20 outline-none text-sm"
                style={{ background: '#32004d' }}
              >
                <option value="">اختر المادة...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">ملف PDF</label>
              <label
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-purple-400/50 cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Upload size={28} className={file ? 'text-green-400' : 'text-white/30'} />
                <span className="text-sm text-white/50">{file ? file.name : 'اختر ملف PDF للكتاب'}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || !selectedSubject || (!!status && !status.done && !status.error)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
            >
              بدء المعالجة والرفع
            </button>

            {/* Progress */}
            {status && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {status.error ? (
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                  ) : status.done ? (
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                  ) : (
                    <svg className="animate-spin h-4 w-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  <span className={`text-sm ${status.error ? 'text-red-400' : status.done ? 'text-green-400' : 'text-white/70'}`}>
                    {status.step}
                  </span>
                </div>
                {!status.error && (
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${status.progress}%`, background: 'linear-gradient(90deg, #500078, #6b009f)' }}
                    />
                  </div>
                )}
                {status.error && <p className="text-red-400 text-xs">{status.error}</p>}
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl border border-white/10 text-sm text-white/50 space-y-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p>📌 يتم تحليل الكتاب وتقسيمه إلى أجزاء</p>
            <p>📌 يتم إنشاء التضمينات (embeddings) محلياً بدون تكلفة</p>
            <p>📌 يستطيع الطلاب الاستفسار عن محتوى الكتاب بعدها</p>
          </div>
        </div>

        {/* Uploaded books */}
        <div>
          <h2 className="text-white font-bold mb-4">الكتب المرفوعة</h2>
          {uploadedBooks.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
              <p>لا توجد كتب مرفوعة بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedBooks.map((b, i) => {
                const subject = subjects.find((s) => s.id === b.subject_id)
                return (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/10" style={{ background: '#500078' }}>
                    <BookOpen size={16} className="text-purple-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{b.metadata?.file_name}</p>
                      <p className="text-white/40 text-xs">{subject?.icon} {subject?.name}</p>
                    </div>
                    <CheckCircle size={14} className="text-green-400 shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
