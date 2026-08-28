-- ================================================================
-- ROAST'em — Migration v2
-- Add soft deletion for profiles and scheduled permanent deletion
-- ================================================================

-- 1. Add deleted_at column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update RLS policies to hide soft-deleted accounts from public views
-- Assuming the previous policy was: CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_active" ON public.profiles
  FOR SELECT USING (deleted_at IS NULL OR auth.uid() = id);

-- 3. Create the permanent deletion function
CREATE OR REPLACE FUNCTION public.permanently_delete_stale_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete users from the auth.users table.
  -- This will cascade and delete their profile, roasts, and follows due to the ON DELETE CASCADE constraints.
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM public.profiles 
    WHERE deleted_at < NOW() - INTERVAL '15 days'
  );
END;
$$;

-- 4. Schedule the deletion function via pg_cron (Runs daily at midnight)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove the job if it already exists to prevent duplicates on re-run (commented out for first run)
-- SELECT cron.unschedule('daily-account-cleanup');

SELECT cron.schedule(
  'daily-account-cleanup',
  '0 0 * * *', -- Everyday at midnight
  $$ SELECT public.permanently_delete_stale_accounts(); $$
);
