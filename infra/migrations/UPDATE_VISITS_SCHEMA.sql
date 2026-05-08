-- ================================================================
-- CLINICAL AGENDA MIGRATION SCRIPT
-- ================================================================
-- Copy ALL of this and paste into: Supabase Dashboard → SQL Editor → Run
-- This updates the 'visits' table to support the new Clinical Agenda features.
-- ================================================================

-- 1. Add the 'notes' column for the Clinical Narrative
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add the 'status' column for tracking session outcomes
-- Valid states are generally 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SCHEDULED';

-- 3. (Optional) In case you need to update any old visits to be 'COMPLETED' automatically
-- UPDATE public.visits SET status = 'COMPLETED' WHERE status IS NULL;
