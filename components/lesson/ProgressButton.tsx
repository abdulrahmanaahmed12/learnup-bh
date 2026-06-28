'use client'

import { useState } from 'react'
import { CheckCircle, Circle } from 'lucide-react'

interface Props {
  lessonId: string
  subjectId: string
  initialCompleted: boolean
}

export default function ProgressButton({ lessonId, subjectId, initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (completed) {
      await fetch('/api/progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId }),
      })
      setCompleted(false)
    } else {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, subject_id: subjectId }),
      })
      setCompleted(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
        completed
          ? 'bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25'
          : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
      }`}
    >
      {completed ? <CheckCircle size={16} /> : <Circle size={16} />}
      {completed ? 'مكتمل' : 'وضّع علامة كامل'}
    </button>
  )
}
