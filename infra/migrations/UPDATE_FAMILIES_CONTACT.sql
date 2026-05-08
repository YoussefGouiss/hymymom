-- Migration to add phone, email, and address to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Index for phone/email searches
CREATE INDEX IF NOT EXISTS idx_families_phone ON families(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_families_email ON families(email) WHERE email IS NOT NULL;
