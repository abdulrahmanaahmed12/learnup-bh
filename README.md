# LearnUp.bh — منصة تعليمية عربية

A full-stack Arabic educational platform built for Bahrain students. Video lessons, AI chat with RAG, quizzes, notes, progress tracking, leaderboard, and certificates — all in one place.

**Repo:** [github.com/abdulrahmanaahmed12/learnup-bh](https://github.com/abdulrahmanaahmed12/learnup-bh)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | SSR, file-based routing, server components |
| Database | Supabase (Postgres + pgvector) | Free tier, realtime, built-in auth |
| Auth | Supabase Auth | Email OTP, cookie-based sessions |
| AI | Groq `llama-3.1-8b-instant` | Fast, cheap (~$2-5/month) |
| Embeddings | `@xenova/transformers` (local) | Zero cost, runs on server |
| Email | Resend | 3,000 emails/month free |
| Styling | Tailwind CSS | RTL-friendly utility classes |
| Deployment | Vercel | Zero-config Next.js |
| Font | Cairo (Google Fonts) | Best Arabic web font |

**Monthly cost: under $20 total** (Supabase free, Vercel free, Resend free, Groq ~$2-5)

---

## Features

### Student Features
- **Video Lessons** — YouTube embeds via youtube-nocookie.com (privacy-safe, no redirect)
- **Progress Tracking** — Mark lessons complete, visual progress bar per subject
- **Certificates** — Canvas-generated PNG certificate when all lessons in a subject are done
- **Leaderboard** — Live ranking by lessons completed (first name only for privacy)
- **AI Chat** — RAG pipeline: questions answered from the uploaded textbook
- **Quizzes** — Multiple-choice quiz after each lesson, instant grading with explanations
- **Notes** — Personal notepad per lesson, auto-saves every 1.5 seconds
- **Subject Files** — Download PDFs, notes, and exercises
- **Comments** — Ask questions under each lesson (with admin pin support)
- **WhatsApp CTA** — One-tap WhatsApp on payment, subject, and landing pages

### Admin Features
- **Dashboard** — Pending payments with real-time badge, total students, active subjects
- **Payment Requests** — Review screenshots, approve/reject, auto-email student
- **Students** — Search, grant/revoke subject access, set expiry dates
- **Subjects** — CRUD, BenefitPay QR upload, price, PayPal email
- **Lessons** — Add lessons (YouTube URL, title, order, free/paid, duration), upload PDFs
- **Quizzes** — Build multiple-choice quizzes per lesson with correct answer + explanation
- **AI Upload** — Upload PDF textbooks → chunked → local embeddings → Supabase vector search

### Infrastructure
- Supabase realtime subscription for admin payment badge (live count updates without refresh)
- Row-level security on all 13 tables
- Admin role verified server-side on every admin route
- Arabic error messages throughout

---

## Project Structure

```
learnup-bh/
├── app/
│   ├── page.tsx                              # Landing page
│   ├── layout.tsx                            # Root RTL layout (Cairo font)
│   ├── globals.css                           # Brand colors, scrollbar
│   ├── auth/
│   │   ├── register/page.tsx                 # Registration form
│   │   ├── login/page.tsx                    # Login form
│   │   └── verify/page.tsx                  # Email verification waiting page
│   ├── dashboard/page.tsx                   # Student dashboard (stats, subjects, payments)
│   ├── subjects/
│   │   └── [subjectId]/
│   │       ├── page.tsx                      # Subject overview + progress bar + lessons list
│   │       ├── lessons/[lessonId]/page.tsx   # Video + quiz + notes + progress button
│   │       ├── files/page.tsx                # Downloadable PDFs
│   │       └── ai/page.tsx                  # AI chatbot (RAG)
│   ├── payment/[subjectId]/page.tsx         # BenefitPay / PayPal payment form
│   ├── leaderboard/page.tsx                 # Top students by completed lessons
│   ├── certificate/[subjectId]/page.tsx     # Canvas certificate (download PNG)
│   ├── admin/
│   │   ├── page.tsx                         # Admin overview
│   │   ├── payments/page.tsx                # Review payment screenshots
│   │   ├── students/page.tsx                # Manage student access
│   │   ├── subjects/page.tsx                # Subject CRUD
│   │   ├── lessons/page.tsx                 # Lesson + file management
│   │   ├── quizzes/page.tsx                 # Quiz builder (per lesson)
│   │   └── ai-upload/page.tsx              # PDF -> embeddings pipeline
│   └── api/
│       ├── chat/route.ts                    # Streaming AI (Groq + RAG)
│       ├── upload-book/route.ts             # PDF -> vector embeddings
│       ├── progress/route.ts                # Mark lesson complete/incomplete
│       ├── notes/route.ts                  # Save/load lesson notes
│       ├── quiz/route.ts                   # Fetch quiz + grade answers
│       └── admin/notify/route.ts           # Email notifications (Resend)
├── components/
│   ├── admin/AdminLayout.tsx               # Sidebar with realtime payment badge
│   ├── certificate/CertificateCanvas.tsx   # Canvas-based certificate generator
│   ├── chat/ChatInterface.tsx              # Streaming chat UI
│   ├── lesson/ProgressButton.tsx           # Mark lesson complete button
│   ├── notes/LessonNotes.tsx               # Auto-saving notes panel
│   ├── payment/PaymentForm.tsx             # BenefitPay + PayPal tabs
│   ├── quiz/QuizPanel.tsx                  # Quiz UI with grading
│   ├── subjects/CommentsSection.tsx        # Comments per lesson
│   ├── video/VideoPlayer.tsx               # YouTube nocookie embed
│   └── layout/Navbar.tsx                  # Top navigation
├── lib/
│   ├── types.ts                            # All TypeScript interfaces
│   ├── utils.ts                            # extractYouTubeId, chunkText, formatDate
│   ├── rag.ts                              # generateEmbedding, searchDocuments
│   ├── groq.ts                             # Groq client
│   ├── email.ts                            # Resend email templates (Arabic)
│   └── supabase/
│       ├── client.ts                       # Browser Supabase client
│       ├── server.ts                       # Server Supabase client (service role)
│       └── middleware.ts                  # Auth + admin role middleware
├── supabase-schema.sql                     # Complete DB schema (run this first)
├── middleware.ts                           # Next.js middleware entry
├── next.config.mjs                         # External packages for @xenova/transformers
└── tailwind.config.ts                      # Brand colors
```

---

## Database Schema (13 tables)

| Table | Purpose |
|---|---|
| `profiles` | User accounts (auto-created on signup via trigger) |
| `subjects` | Course subjects with price, QR, PayPal |
| `lessons` | Video lessons (YouTube URL, order, free/paid) |
| `subject_files` | PDF files per subject |
| `student_access` | Which students can access which subjects |
| `payment_requests` | Payment screenshots + approval status |
| `comments` | Student questions per lesson |
| `lesson_progress` | Which lessons each student completed |
| `quizzes` | Quiz per lesson |
| `quiz_questions` | Multiple-choice questions with correct answer |
| `quiz_results` | Student quiz scores and answers |
| `lesson_notes` | Personal notes per student per lesson |
| `documents` | PDF chunks with `vector(384)` embeddings for RAG |

---

## Setup Guide

### 1. Clone and Install

```bash
git clone https://github.com/abdulrahmanaahmed12/learnup-bh
cd learnup-bh
npm install
```

### 2. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run `supabase-schema.sql`
3. Go to **Storage** and create 3 buckets:
   - `payments` — Private (payment screenshots)
   - `files` — Public (subject PDFs, notes)
   - `public` — Public (QR codes, avatars)
4. Go to **Authentication > Email** and enable **Email OTP** (magic link)
5. Enable **Realtime** for `payment_requests` and `lesson_progress` tables (Database > Replication)

### 3. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_...
RESEND_API_KEY=re_...
ADMIN_EMAIL=learnupbh@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Make Yourself Admin

After signing up on the platform, run in Supabase SQL Editor:

```sql
update profiles set role = 'admin' where email = 'learnupbh@gmail.com';
```

Then navigate to `/admin` — the full admin panel will be accessible.

### 5. Run Locally

```bash
npm run dev
# Opens on http://localhost:3000
```

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Set all env vars in Vercel Dashboard > Settings > Environment Variables.
Update `NEXT_PUBLIC_SITE_URL` to your production domain.

---

## AI Pipeline (RAG)

1. **Admin uploads PDF** at `/admin/ai-upload`
2. `pdf-parse` extracts raw text
3. `chunkText()` splits into 500-word chunks with 50-word overlap
4. `@xenova/transformers` (`all-MiniLM-L6-v2`) generates `vector(384)` embeddings **locally** — zero cost
5. Chunks + embeddings stored in `documents` table in Supabase
6. **Student asks question** at `/subjects/[id]/ai`
7. Question is embedded → cosine similarity search returns top 5 chunks
8. Arabic system prompt + retrieved chunks + question sent to Groq `llama-3.1-8b-instant`
9. Response streamed back; source page numbers shown as citation badges

---

## Certificate System

When a student completes all lessons in a subject (marks each as done), a certificate is available at `/certificate/[subjectId]`. The certificate is drawn on an HTML Canvas element with:

- Brand gradient background (#210340 → #32004d)
- LU monogram logo
- Student full name
- Subject name
- Completion date (Arabic locale)
- Download as PNG button

---

## Brand

| Token | Value |
|---|---|
| Background | `#32004d` |
| Cards / Accent | `#500078` |
| Light accent | `#6b009f` |
| Text | `#ffffff` |
| Font | Cairo (Arabic + Latin) |
| Logo | LU monogram |
| Direction | RTL (`dir="rtl"` on `<html>`) |

---

## Security

- `.env.local` is gitignored — never commit real keys
- YouTube: `youtube-nocookie.com` embeds only — no redirect, no cross-site tracking
- All admin routes: role checked server-side in middleware AND in each page component
- RLS enabled on all 13 Supabase tables — students can only see their own data
- `SUPABASE_SERVICE_ROLE_KEY` used only in server-side API routes, never exposed to the browser
- Payment screenshots stored in a private Supabase bucket

---

## Contact

- Instagram: [@learnup.bh](https://instagram.com/learnup.bh)
- WhatsApp: [+973 3808 6464](https://wa.me/97338086464)
- Email: learnupbh@gmail.com
