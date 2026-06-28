export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'student' | 'admin'
  avatar_url: string | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  name_en: string
  description: string | null
  icon: string | null
  level: string[] | null
  is_active: boolean
  created_at: string
  price?: number | null
  benefitpay_qr_url?: string | null
  paypal_email?: string | null
}

export interface Lesson {
  id: string
  subject_id: string
  title: string
  description: string | null
  youtube_url: string
  order_index: number
  is_free: boolean
  duration: string | null
  created_at: string
}

export interface SubjectFile {
  id: string
  subject_id: string
  name: string
  file_url: string
  file_type: 'book' | 'notes' | 'exercises' | null
  created_at: string
}

export interface StudentAccess {
  id: string
  student_id: string
  subject_id: string
  granted_at: string
  expires_at: string | null
  granted_by: string | null
}

export interface PaymentRequest {
  id: string
  student_id: string
  subject_id: string
  amount: number | null
  payment_method: 'benefitpay' | 'paypal'
  screenshot_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  profiles?: Profile
  subjects?: Subject
}

export interface Comment {
  id: string
  lesson_id: string
  student_id: string
  content: string
  is_pinned: boolean
  created_at: string
  profiles?: Profile
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ page: number; file_name: string }>
}

export interface LessonProgress {
  id: string
  student_id: string
  lesson_id: string
  subject_id: string
  completed: boolean
  completed_at: string
}

export interface Quiz {
  id: string
  lesson_id: string
  subject_id: string
  title: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
  explanation: string | null
}

export interface QuizResult {
  id: string
  student_id: string
  quiz_id: string
  lesson_id: string
  score: number
  total: number
  answers: Array<{ question_id: string; selected: number; correct: boolean }>
  completed_at: string
}

export interface LessonNote {
  id: string
  student_id: string
  lesson_id: string
  content: string
  updated_at: string
}
