'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2, BookOpen } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

const STARTER_QUESTIONS = [
  'اشرح لي الفصل الأول',
  'ما هي أهم المفاهيم في هذه المادة؟',
  'أعطني أمثلة تطبيقية',
  'ما الفرق بين ...',
]

interface Props {
  subjectId: string
  subjectName: string
}

export default function ChatInterface({ subjectId, subjectName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return

    const userMsg: ChatMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), subjectId, history: messages }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: err.error || 'حدث خطأ، حاول مرة أخرى' }])
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let sources: ChatMessage['sources'] = []

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            if (data.startsWith('[SOURCES]')) {
              try { sources = JSON.parse(data.slice(9)) } catch {}
            } else {
              full += data
              setMessages([...newMessages, { role: 'assistant', content: full, sources }])
            }
          }
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'حدث خطأ في الاتصال. تحقق من اتصالك وحاول مرة أخرى.' }])
    }
    setStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#210340', minHeight: '65vh' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6 py-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}>
              <Bot size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">مساعد {subjectName} الذكي</h3>
              <p className="text-white/50 text-sm max-w-sm">
                أنا هنا فقط لمساعدتك في مادة {subjectName} بناءً على الكتاب المقرر
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="p-3 rounded-xl text-white/70 hover:text-white text-sm text-right border border-white/10 hover:border-purple-400/40 transition-all hover:bg-purple-500/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-1"
              style={{ background: msg.role === 'user' ? '#500078' : '#6b009f' }}
            >
              {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? '#500078' : '#2d0045',
                  borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                }}
              >
                {msg.content || (streaming && idx === messages.length - 1 ? (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : '')}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.sources.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-purple-300" style={{ background: 'rgba(168,85,247,0.15)' }}>
                      <BookOpen size={10} /> {s.file_name} • ص {s.page}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs mb-3 transition-colors"
          >
            <Trash2 size={12} /> مسح المحادثة
          </button>
        )}
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 border border-white/20 focus:border-purple-400 outline-none text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={streaming || !input.trim()}
            className="px-4 py-2 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-40 self-end"
            style={{ background: 'linear-gradient(135deg, #500078, #6b009f)' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
