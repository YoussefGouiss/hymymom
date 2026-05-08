-- Add user_id to visits
ALTER TABLE visits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to payment_logs
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on visits (it might already be enabled, but let's be sure)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for visits
DROP POLICY IF EXISTS "Allow authenticated users to manage visits" ON visits;
CREATE POLICY "Users can manage their own visits" ON visits
    FOR ALL USING (user_id = auth.uid());

-- Update RLS policies for payments
DROP POLICY IF EXISTS "Allow authenticated users to manage payments" ON payments;
CREATE POLICY "Users can manage their own payments" ON payments
    FOR ALL USING (user_id = auth.uid());

-- Update RLS policies for payment_logs
DROP POLICY IF EXISTS "Allow authenticated users to manage payment logs" ON payment_logs;
CREATE POLICY "Users can manage their own payment logs" ON payment_logs
    FOR ALL USING (user_id = auth.uid());

-- Update RLS policies for families (just in case)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage families" ON families;
CREATE POLICY "Users can manage their own families" ON families
    FOR ALL USING (user_id = auth.uid());

-- Update RLS policies for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage notes" ON notes;
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL USING (user_id = auth.uid());

-- Backfill user_id for visits from families table
UPDATE visits v
SET user_id = f.user_id
FROM families f
WHERE v.family_id = f.id AND v.user_id IS NULL;

-- Backfill user_id for payments from families table
UPDATE payments p
SET user_id = f.user_id
FROM families f
WHERE p.family_id = f.id AND p.user_id IS NULL;

-- Backfill user_id for notes from families table
UPDATE notes n
SET user_id = f.user_id
FROM families f
WHERE n.family_id = f.id AND n.user_id IS NULL;

-- Add NOT NULL constraints after backfill
ALTER TABLE visits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;

-- IMPORTANT: Remove any data that doesn't have a user_id if you want a clean start, 
-- or manually assign them in the database.
-- Example: DELETE FROM families WHERE user_id IS NULL;
