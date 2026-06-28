import { createServiceClient } from '@/lib/supabase/server'

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Use @xenova/transformers for free local embeddings
  const { pipeline } = await import('@xenova/transformers')
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export async function searchDocuments(
  query: string,
  subjectId: string,
  topK = 5
): Promise<Array<{ content: string; metadata: Record<string, unknown> }>> {
  const supabase = await createServiceClient()
  const queryEmbedding = await generateEmbedding(query)

  const { data: docs } = await supabase
    .from('documents')
    .select('content, embedding, metadata')
    .eq('subject_id', subjectId)

  if (!docs || docs.length === 0) return []

  const scored = docs
    .map((doc) => ({
      content: doc.content,
      metadata: doc.metadata as Record<string, unknown>,
      score: cosineSimilarity(queryEmbedding, doc.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map(({ content, metadata }) => ({ content, metadata }))
}

export function buildSystemPrompt(subjectName: string, context: string): string {
  return `أنت مساعد تعليمي متخصص في مادة ${subjectName}.
مهمتك هي مساعدة الطلاب بناءً فقط على محتوى الكتاب المقرر المقدم لك.

المحتوى المتاح من الكتاب:
${context}

التعليمات:
- أجب فقط من المحتوى أعلاه
- إذا لم تجد الإجابة في المحتوى، قل بوضوح: "لم أجد هذه المعلومات في الكتاب المقرر"
- اشرح بطريقة سهلة وبسيطة بالعربية
- استخدم أمثلة عملية عند الحاجة
- أذكر رقم الصفحة إذا كان متوفراً في البيانات
- لا تخترع معلومات غير موجودة في المحتوى`
}
