-- Migration V6: Aura Decay + Weekly Cron
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new

-- ── 1. Aura Decay Function ────────────────────────────────────────
-- Decays all profiles' aura by 1.5% every Sunday.
-- Floor: 200 points (starting aura — can never go below).
CREATE OR REPLACE FUNCTION public.apply_weekly_aura_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET aura_points = GREATEST(200, FLOOR(aura_points * 0.985)::INT)
  WHERE is_banned = FALSE;
END;
$$;

-- ── 2. Enable pg_cron extension (run once) ────────────────────────
-- NOTE: This requires pg_cron to be enabled in your Supabase project.
-- Go to: Database → Extensions → search "pg_cron" → Enable
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 3. Schedule weekly decay every Sunday at midnight UTC ─────────
SELECT cron.schedule(
  'weekly-aura-decay',         -- job name (unique)
  '0 0 * * 0',                 -- cron: every Sunday at 00:00 UTC
  'SELECT public.apply_weekly_aura_decay();'
);

-- ── 4. Check scheduled jobs ───────────────────────────────────────
-- SELECT * FROM cron.job;

-- ── 5. To run decay manually RIGHT NOW (for testing) ─────────────
-- SELECT public.apply_weekly_aura_decay();
-- SELECT handle, aura_points FROM public.profiles ORDER BY aura_points DESC;

-- ── 6. To cancel the cron job ─────────────────────────────────────
-- SELECT cron.unschedule('weekly-aura-decay');
