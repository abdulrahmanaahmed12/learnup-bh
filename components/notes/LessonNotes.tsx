'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { NotebookPen, Save, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  lessonId: string
}

export default function LessonNotes({ lessonId }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/notes?lesson_id=${lessonId}`)
    const data = await res.json()
    if (data.note?.content) setContent(data.note.content)
    setLoaded(true)
  }, [lessonId])

  useEffect(() => { load() }, [load])

  async function save(text: string) {
    setSaving(true)
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, content: text }),
    })
    setSaved(true)
    setSaving(false)
  }

  function handleChange(val: string) {
    setContent(val)
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 1500)
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#500078' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <NotebookPen size={16} className="text-purple-300" />
          ملاحظاتي لهذا الدرس
          {!saved && !saving && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
          {saving && <span className="text-xs text-white/40">يحفظ...</span>}
          {saved && loaded && content && <span className="text-xs text-green-400">محفوظ ✓</span>}
        </span>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/10">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="اكتب ملاحظاتك هنا... تُحفظ تلقائياً"
            rows={6}
            className="w-full mt-4 bg-transparent text-white placeholder-white/30 text-sm leading-relaxed outline-none resize-none"
            dir="rtl"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-white/30 text-xs">{content.length} حرف</span>
            <button
              onClick={() => save(content)}
              disabled={saved || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white font-medium transition-all disabled:opacity-30"
              style={{ background: '#6b009f' }}
            >
              <Save size={12} /> حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
