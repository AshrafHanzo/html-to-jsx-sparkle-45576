-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT,
  department TEXT,
  location TEXT,
  type TEXT DEFAULT 'Full-time',
  work_mode TEXT DEFAULT 'On-site',
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  salary_min TEXT,
  salary_max TEXT,
  openings INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Action',
  urgency TEXT,
  commission TEXT,
  tenure TEXT,
  shift TEXT,
  category TEXT,
  experience TEXT,
  age_range TEXT,
  address TEXT,
  required_skills TEXT,
  preferred_skills TEXT,
  nice_to_have TEXT,
  languages_required TEXT,
  seo_keywords TEXT,
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  experience TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'New',
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  company TEXT,
  status TEXT DEFAULT 'Applied',
  sourced_by TEXT,
  sourced_from TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  interview_date TEXT,
  interview_type TEXT,
  interviewer TEXT,
  location TEXT,
  status TEXT DEFAULT 'Scheduled',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since it's an internal recruitment tool)
CREATE POLICY "Allow all access to jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON public.jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);