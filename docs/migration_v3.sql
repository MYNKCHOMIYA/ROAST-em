-- Migration V3: Remove phone_hash from profiles

-- 1. Drop the unique constraint if it exists (Supabase auto-names it profiles_phone_hash_key)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_hash_key;

-- 2. Drop the column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_hash;
