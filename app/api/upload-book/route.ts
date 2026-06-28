import { createClient } from '@/lib/supabase/server'
import { chunkText } from '@/lib/utils'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + '\n'))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const subjectId = formData.get('subjectId') as string

  if (!file || !subjectId) {
    return Response.json({ error: 'الملف والمادة مطلوبان' }, { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { step: 'قراءة الملف...', progress: 10, done: false })

        // Parse PDF
        const buffer = Buffer.from(await file.arrayBuffer())
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const pdfData = await pdfParse(buffer)
        const text = pdfData.text

        send(controller, { step: `تقسيم النص إلى أجزاء...`, progress: 30, done: false })

        const chunks = chunkText(text, 500, 50)

        send(controller, { step: `إنشاء التضمينات لـ ${chunks.length} جزء...`, progress: 40, done: false })

        // Generate embeddings locally
        const { pipeline } = await import('@xenova/transformers')
        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

        const docs = []
        for (let i = 0; i < chunks.length; i++) {
          const output = await embedder(chunks[i], { pooling: 'mean', normalize: true })
          const embedding = Array.from(output.data as Float32Array)
          docs.push({
            subject_id: subjectId,
            content: chunks[i],
            embedding,
            metadata: {
              file_name: file.name,
              chunk_index: i,
              page: Math.floor(i / 3) + 1,
            },
          })

          if (i % 10 === 0) {
            const progress = 40 + Math.floor((i / chunks.length) * 50)
            send(controller, { step: `معالجة الأجزاء: ${i + 1}/${chunks.length}`, progress, done: false })
          }
        }

        send(controller, { step: 'حفظ في قاعدة البيانات...', progress: 92, done: false })

        // Batch insert
        const BATCH = 50
        for (let i = 0; i < docs.length; i += BATCH) {
          await supabase.from('documents').insert(docs.slice(i, i + BATCH))
        }

        send(controller, {
          step: `تم بنجاح! ${chunks.length} جزء محفوظ للمادة`,
          progress: 100,
          done: true,
        })
      } catch (err) {
        send(controller, {
          step: 'فشل',
          progress: 0,
          done: false,
          error: err instanceof Error ? err.message : 'خطأ غير معروف',
        })
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' },
  })
}
