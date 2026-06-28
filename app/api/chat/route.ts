import { createClient } from '@/lib/supabase/server'
import { groq, GROQ_MODEL } from '@/lib/groq'
import { searchDocuments, buildSystemPrompt } from '@/lib/rag'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
  }

  const { message, subjectId, history = [] } = await req.json()

  if (!message || !subjectId) {
    return Response.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
  }

  // Verify access
  const { data: access } = await supabase
    .from('student_access')
    .select('id')
    .eq('student_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (!access) {
    return Response.json({ error: 'ليس لديك صلاحية الوصول لهذه المادة' }, { status: 403 })
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single()

  // RAG: search relevant chunks
  let context = ''
  const sources: Array<{ page: number; file_name: string }> = []

  try {
    const docs = await searchDocuments(message, subjectId)
    if (docs.length > 0) {
      context = docs.map((d, i) => {
        const meta = d.metadata as { page?: number; file_name?: string }
        if (meta?.page) sources.push({ page: meta.page, file_name: meta.file_name ?? 'الكتاب' })
        return `[${i + 1}] ${d.content}`
      }).join('\n\n')
    }
  } catch {
    // No embeddings available yet — answer without context
    context = ''
  }

  const systemPrompt = context
    ? buildSystemPrompt(subject?.name ?? 'المادة', context)
    : `أنت مساعد تعليمي لمادة ${subject?.name ?? 'المادة'}. لا يوجد محتوى من الكتاب متاح حالياً. أجب بشكل عام وأخبر الطالب بأن الكتاب لم يُحمَّل بعد.`

  const chatHistory = history.slice(-10).map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) => new TextEncoder().encode(`data: ${text}\n\n`)

      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: message },
          ],
          stream: true,
          max_tokens: 1024,
          temperature: 0.3,
        })

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encode(text))
        }

        if (sources.length > 0) {
          controller.enqueue(encode(`[SOURCES]${JSON.stringify(sources)}`))
        }
        controller.enqueue(encode('[DONE]'))
      } catch {
        controller.enqueue(encode('حدث خطأ في المساعد الذكي. حاول مرة أخرى.'))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
