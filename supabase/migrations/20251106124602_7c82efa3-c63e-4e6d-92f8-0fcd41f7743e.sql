-- Add missing fields to candidates table
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS aadhaar text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS locality text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS exp_years integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS exp_months integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pref_categories text[],
ADD COLUMN IF NOT EXISTS pref_employment text[],
ADD COLUMN IF NOT EXISTS work_types text[];

-- Update status column with more options
ALTER TABLE public.candidates 
ALTER COLUMN status SET DEFAULT 'Applied';

-- Add comment for clarity
COMMENT ON COLUMN public.candidates.exp_years IS 'Years of work experience';
COMMENT ON COLUMN public.candidates.exp_months IS 'Additional months of work experience (0-11)';
COMMENT ON COLUMN public.candidates.work_types IS 'Preferred work types: Remote, Hybrid, On-site';
COMMENT ON COLUMN public.candidates.pref_employment IS 'Preferred employment types: Full-time, Part-time, Contract, Internship';
COMMENT ON COLUMN public.candidates.pref_categories IS 'Preferred job categories and industries';