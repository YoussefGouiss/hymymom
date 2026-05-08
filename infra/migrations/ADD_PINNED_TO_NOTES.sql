-- Add is_pinned to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Update RLS policies if necessary (usually not needed if already allowing all)
