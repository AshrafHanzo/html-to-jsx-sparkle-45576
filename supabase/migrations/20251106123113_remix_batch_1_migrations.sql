
-- Migration: 20251106122547

-- Migration: 20251106113042

-- Migration: 20251106110312

-- Migration: 20251106104854
-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  position TEXT,
  experience TEXT,
  skills TEXT[],
  resume_url TEXT,
  status TEXT DEFAULT 'Applied' CHECK (status IN ('Applied', 'Screening', 'Interview', 'Selected', 'Rejected', 'Joined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'On Hold')),
  posted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Shortlisted', 'Rejected')),
  applied_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('Phone Screen', 'Technical', 'HR', 'Final', 'Panel')),
  interviewer TEXT,
  location TEXT,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can restrict these later with authentication)
CREATE POLICY "Anyone can view candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert candidates" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update candidates" ON public.candidates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete candidates" ON public.candidates FOR DELETE USING (true);

CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update jobs" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete jobs" ON public.jobs FOR DELETE USING (true);

CREATE POLICY "Anyone can view applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete applications" ON public.applications FOR DELETE USING (true);

CREATE POLICY "Anyone can view interviews" ON public.interviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert interviews" ON public.interviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update interviews" ON public.interviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete interviews" ON public.interviews FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_jobs_status ON public.jobs(status);


-- Migration: 20251106110902
-- Add new columns to applications table for full tracking functionality
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS sourced_by TEXT,
ADD COLUMN IF NOT EXISTS sourced_from TEXT DEFAULT 'Linked-in',
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Update status to match the HTML version
-- Status options: Applied, Interview Scheduled, Qualified, Rejected, Offer, Joined
COMMENT ON COLUMN applications.status IS 'Status: Applied, Interview Scheduled, Qualified, Rejected, Offer, Joined';


-- Migration: 20251106113320
-- Add new fields to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS openings integer DEFAULT 1;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_min text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_max text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS commission text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tenure text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS shift text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS required_skills text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS preferred_skills text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS nice_to_have text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS age_range text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS languages_required text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Migration: 20251106121640
-- Drop the old check constraint on jobs status column
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add new check constraint with updated values
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('Action', 'Hold', 'Closed'));

