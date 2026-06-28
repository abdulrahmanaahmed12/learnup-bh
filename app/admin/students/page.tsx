'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Trash2, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile, Subject, StudentAccess } from '@/lib/types'

interface StudentRow extends Profile {
  accesses: (StudentAccess & { subjects: Subject })[]
}

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [search, setSearch] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [grantModal, setGrantModal] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const supabase = createClient()

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .ilike('full_name', `%${search}%`)
      .order('created_at', { ascending: false })

    if (!profiles) { setLoading(false); return }

    const withAccess = await Promise.all(
      profiles.map(async (p) => {
        const { data: accesses } = await supabase
          .from('student_access')
          .select('*, subjects(*)')
          .eq('student_id', p.id)
        return { ...p, accesses: accesses || [] }
      })
    )
    setStudents(withAccess as StudentRow[])
    setLoading(false)
  }, [search, supabase])

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).then(({ data }) => setSubjects(data || []))
    fetchStudents()
  }, [fetchStudents, supabase])

  async function grantAccess(studentId: string) {
    if (!selectedSubject) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('student_access').insert({
      student_id: studentId,
      subject_id: selectedSubject,
      granted_by: user?.id,
      expires_at: expiryDate || null,
    })
    setGrantModal(null)
    setSelectedSubject('')
    setExpiryDate('')
    fetchStudents()
  }

  async function revokeAccess(accessId: string) {
    if (!confirm('هل أنت متأكد من إلغاء الوصول؟')) return
    await supabase.from('student_access').delete().eq('id', accessId)
    fetchStudents()
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">الطلاب</h1>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم..."
            className="pr-10 pl-4 py-2.5 rounded-xl text-sm text-white border border-white/20 outline-none"
            style={{ background: '#500078' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl skeleton" />)}</div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="p-5 rounded-2xl border border-white/10" style={{ background: '#500078' }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold">{student.full_name}</h3>
                  <p className="text-white/50 text-sm">{student.email}</p>
                  <p className="text-white/30 text-xs mt-0.5">انضم {formatDate(student.created_at)}</p>
                </div>
                <button
                  onClick={() => setGrantModal(student.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-purple-300 hover:text-white border border-purple-400/30 hover:border-purple-400 transition-all shrink-0"
                >
                  <Plus size={14} /> منح وصول
                </button>
              </div>

              {student.accesses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs mb-2">المواد المفعّلة:</p>
                  <div className="flex flex-wrap gap-2">
                    {student.accesses.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <span>{(a.subjects as Subject)?.icon} {(a.subjects as Subject)?.name}</span>
                        {a.expires_at && (
                          <span className="text-white/40 text-xs flex items-center gap-0.5">
                            <Calendar size={10} /> {formatDate(a.expires_at)}
                          </span>
                        )}
                        <button
                          onClick={() => revokeAccess(a.id)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grant modal inline */}
              {grantModal === student.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none"
                    style={{ background: '#32004d' }}
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="تاريخ الانتهاء (اختياري)"
                    className="w-full px-3 py-2 rounded-xl text-sm text-white border border-white/20 outline-none"
                    style={{ background: '#32004d' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => grantAccess(student.id)}
                      disabled={!selectedSubject}
                      className="px-4 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-40 transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
                    >
                      منح الوصول
                    </button>
                    <button
                      onClick={() => setGrantModal(null)}
                      className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white border border-white/20 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-16 text-white/40">لا توجد نتائج</div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
