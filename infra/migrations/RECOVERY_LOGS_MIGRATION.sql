-- ================================================================
-- RECOVERY LOGS FEATURE - DATABASE SETUP
-- ================================================================
-- Copy ALL of this and paste into: Supabase → SQL Editor → Run
-- ================================================================

-- Step 1: Create recovery_logs table (using BIGINT to match families.id)
CREATE TABLE IF NOT EXISTS public.recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id BIGINT NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'low')),
  sleep_hours NUMERIC(4,1),
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  baby_feeding_type TEXT CHECK (baby_feeding_type IN ('breastfeeding', 'formula', 'mixed')),
  baby_feeding_issues TEXT,
  baby_sleep_hours NUMERIC(4,1),
  baby_diapers INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX idx_recovery_logs_family_id ON recovery_logs(family_id);
CREATE INDEX idx_recovery_logs_date ON recovery_logs(date);
CREATE INDEX idx_recovery_logs_family_date ON recovery_logs(family_id, date DESC);

-- Step 3: Enable RLS
ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view recovery logs for families they own"
  ON recovery_logs FOR SELECT
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recovery logs for families they own"
  ON recovery_logs FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recovery logs for families they own"
  ON recovery_logs FOR UPDATE
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recovery logs for families they own"
  ON recovery_logs FOR DELETE
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check table created
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'recovery_logs' ORDER BY ordinal_position;

-- Check RLS enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'recovery_logs';