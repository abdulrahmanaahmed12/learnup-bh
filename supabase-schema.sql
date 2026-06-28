-- ============================================
-- LearnUp.bh — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgvector extension for RAG
create extension if not exists vector;

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text default 'student' check (role in ('student', 'admin')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SUBJECTS
-- ============================================
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null,
  description text,
  icon text,
  level text[],
  is_active boolean default true,
  price decimal(10,3),
  benefitpay_qr_url text,
  paypal_email text,
  created_at timestamptz default now()
);

-- ============================================
-- LESSONS
-- ============================================
create table lessons (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects on delete cascade,
  title text not null,
  description text,
  youtube_url text not null,
  order_index int default 0,
  is_free boolean default false,
  duration text,
  created_at timestamptz default now()
);

-- ============================================
-- SUBJECT FILES
-- ============================================
create table subject_files (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects on delete cascade,
  name text not null,
  file_url text not null,
  file_type text check (file_type in ('book', 'notes', 'exercises')),
  created_at timestamptz default now()
);

-- ============================================
-- STUDENT ACCESS
-- ============================================
create table student_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles on delete cascade,
  subject_id uuid references subjects on delete cascade,
  granted_at timestamptz default now(),
  expires_at timestamptz,
  granted_by uuid references profiles,
  unique(student_id, subject_id)
);

-- ============================================
-- PAYMENT REQUESTS
-- ============================================
create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles on delete cascade,
  subject_id uuid references subjects on delete cascade,
  amount decimal(10,3),
  payment_method text check (payment_method in ('benefitpay', 'paypal')),
  screenshot_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles
);

-- ============================================
-- COMMENTS
-- ============================================
create table comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons on delete cascade,
  student_id uuid references profiles on delete cascade,
  content text not null,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- DOCUMENTS (RAG embeddings)
-- ============================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects on delete cascade,
  content text not null,
  embedding vector(384),
  metadata jsonb,
  created_at timestamptz default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Subjects (public read)
alter table subjects enable row level security;
create policy "Anyone can view active subjects" on subjects for select using (is_active = true);
create policy "Admins can manage subjects" on subjects for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Lessons (free lessons public, paid need access)
alter table lessons enable row level security;
create policy "Anyone can view free lessons" on lessons for select using (is_free = true);
create policy "Students with access can view lessons" on lessons for select using (
  exists (
    select 1 from student_access
    where student_id = auth.uid() and subject_id = lessons.subject_id
  )
);
create policy "Admins can manage lessons" on lessons for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Subject files (need access)
alter table subject_files enable row level security;
create policy "Students with access can view files" on subject_files for select using (
  exists (
    select 1 from student_access
    where student_id = auth.uid() and subject_id = subject_files.subject_id
  )
);
create policy "Admins can manage files" on subject_files for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Student access
alter table student_access enable row level security;
create policy "Students can view own access" on student_access for select using (student_id = auth.uid());
create policy "Admins can manage access" on student_access for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Payment requests
alter table payment_requests enable row level security;
create policy "Students can view own payments" on payment_requests for select using (student_id = auth.uid());
create policy "Students can create payments" on payment_requests for insert with check (student_id = auth.uid());
create policy "Admins can manage payments" on payment_requests for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Comments
alter table comments enable row level security;
create policy "Anyone with lesson access can view comments" on comments for select using (
  exists (
    select 1 from lessons l
    left join student_access sa on sa.subject_id = l.subject_id and sa.student_id = auth.uid()
    where l.id = comments.lesson_id and (l.is_free = true or sa.id is not null)
  )
);
create policy "Students can insert comments" on comments for insert with check (student_id = auth.uid());
create policy "Admins can manage comments" on comments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Documents (server-side only via service role)
alter table documents enable row level security;
create policy "Admins can manage documents" on documents for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- STORAGE BUCKETS
-- (Run in Supabase Dashboard > Storage)
-- ============================================
-- Create these buckets:
--   "payments"  (private) — payment screenshots
--   "files"     (public)  — subject PDFs
--   "public"    (public)  — QR codes, images

-- ============================================
-- SEED: Make yourself admin
-- ============================================
-- After creating your account, run:
-- update profiles set role = 'admin' where email = 'abdulrahman@learnup.bh';

-- ============================================
-- SEED: Sample subjects
-- ============================================
insert into subjects (name, name_en, description, icon, level, price) values
  ('الرياضيات', 'Mathematics', 'الجبر، الهندسة، التفاضل والتكامل', '📐', array['ثانوي', 'جامعي'], 5.000),
  ('الفيزياء', 'Physics', 'الميكانيكا، الكهرباء، الموجات', '⚡', array['ثانوي'], 5.000),
  ('الكيمياء', 'Chemistry', 'الكيمياء العضوية وغير العضوية', '🧪', array['ثانوي'], 5.000),
  ('تقنية المعلومات', 'Information Technology', 'البرمجة، الشبكات، قواعد البيانات', '💻', array['ثانوي', 'جامعي'], 5.000);
