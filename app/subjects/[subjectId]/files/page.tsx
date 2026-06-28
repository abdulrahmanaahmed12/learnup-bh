import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { FileText, Download, BookOpen, FileEdit, Dumbbell } from 'lucide-react'
import type { Profile, SubjectFile } from '@/lib/types'

interface Props {
  params: Promise<{ subjectId: string }>
}

const fileTypeMap = {
  book: { label: 'كتاب', icon: BookOpen, color: 'text-blue-400' },
  notes: { label: 'مذكرات', icon: FileEdit, color: 'text-yellow-400' },
  exercises: { label: 'تمارين', icon: Dumbbell, color: 'text-green-400' },
}

export default async function FilesPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let profile: Profile | null = null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  profile = data

  const { data: subject } = await supabase.from('subjects').select('*').eq('id', subjectId).single()
  if (!subject) notFound()

  const { data: access } = await supabase
    .from('student_access')
    .select('id')
    .eq('student_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (!access) redirect(`/subjects/${subjectId}`)

  const { data: files } = await supabase
    .from('subject_files')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#32004d' }}>
      <Navbar profile={profile} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{subject.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{subject.name}</h1>
            <p className="text-white/50 text-sm">الملفات والكتب</p>
          </div>
        </div>

        {files && files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((file: SubjectFile) => {
              const typeInfo = fileTypeMap[file.file_type as keyof typeof fileTypeMap] ?? fileTypeMap.book
              const Icon = typeInfo.icon
              return (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-all group"
                  style={{ background: '#500078' }}
                >
                  <div className="p-3 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Icon size={22} className={typeInfo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{file.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{typeInfo.label}</p>
                  </div>
                  <Download size={18} className="text-white/30 group-hover:text-purple-300 transition-colors shrink-0" />
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-white/40">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>لا توجد ملفات بعد</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/subjects/${subjectId}`} className="text-purple-300 hover:text-white transition-colors text-sm">
            ← العودة للدروس
          </Link>
        </div>
      </main>
    </div>
  )
}
