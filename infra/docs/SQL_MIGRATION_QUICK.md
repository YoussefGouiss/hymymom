-- Just run this in Supabase SQL Editor:

ALTER TABLE public.families ADD COLUMN photo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('family-photos', 'family-photos', true)
ON CONFLICT DO NOTHING;