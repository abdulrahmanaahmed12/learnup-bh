'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Pin, Send, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Comment } from '@/lib/types'

interface Props {
  lessonId: string
  userId: string
  isAdmin: boolean
}

export default function CommentsSection({ lessonId, userId, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('lesson_id', lessonId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) || [])
    setFetching(false)
  }, [lessonId, supabase])

  useEffect(() => { fetchComments() }, [fetchComments])

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    await supabase.from('comments').insert({
      lesson_id: lessonId,
      student_id: userId,
      content: text.trim(),
    })
    setText('')
    await fetchComments()
    setLoading(false)
  }

  async function togglePin(id: string, current: boolean) {
    await supabase.from('comments').update({ is_pinned: !current }).eq('id', id)
    await fetchComments()
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    await fetchComments()
  }

  return (
    <div className="p-5 rounded-2xl border border-white/10 space-y-5" style={{ background: '#500078' }}>
      <h3 className="text-white font-bold flex items-center gap-2">
        <MessageCircle size={16} className="text-purple-300" />
        التعليقات ({comments.length})
      </h3>

      {/* Form */}
      <form onSubmit={submitComment} className="flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب تعليقك أو سؤالك..."
          className="flex-1 px-4 py-2.5 rounded-xl text-white placeholder-white/30 border border-white/20 focus:border-purple-400 outline-none text-sm"
          style={{ background: 'rgba(255,255,255,0.07)' }}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* List */}
      {fetching ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl skeleton" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-4">لا توجد تعليقات بعد. كن أول من يعلّق!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border"
              style={{
                background: c.is_pinned ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
                borderColor: c.is_pinned ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {c.is_pinned && <Pin size={12} className="text-purple-400" />}
                    <span className="text-purple-300 text-sm font-semibold">
                      {(c.profiles as { full_name: string })?.full_name || 'طالب'}
                    </span>
                    <span className="text-white/30 text-xs">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-white/80 text-sm">{c.content}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => togglePin(c.id, c.is_pinned)}
                      className="p-1.5 rounded-lg hover:bg-purple-500/20 text-white/40 hover:text-purple-300 transition-all"
                      title={c.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                    >
                      <Pin size={13} />
                    </button>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
