-- Migration V7: Report & Block System
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new

-- ── 1. Blocks Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
-- Users can see their own blocks
CREATE POLICY "Users can view own blocks" ON public.blocks 
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- ── 2. Reports Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roast_id UUID NOT NULL REFERENCES public.roasts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(roast_id, reporter_id) -- One report per roast per user
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.reports 
  FOR SELECT USING (auth.uid() = reporter_id);
-- Insert via RPC, so no insert policy needed directly

-- ── 3. Toggle Block RPC ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_block(p_target_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.blocks 
    WHERE blocker_id = auth.uid() AND blocked_id = p_target_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.blocks WHERE blocker_id = auth.uid() AND blocked_id = p_target_id;
    -- Also remove any existing follows between the two
    RETURN false; -- Unblocked
  ELSE
    INSERT INTO public.blocks (blocker_id, blocked_id) VALUES (auth.uid(), p_target_id);
    -- Remove follows in both directions
    DELETE FROM public.follows 
      WHERE (follower_id = auth.uid() AND following_id = p_target_id)
         OR (follower_id = p_target_id AND following_id = auth.uid());
    RETURN true; -- Blocked
  END IF;
END;
$$;

-- ── 4. Report Roast RPC (Auto-flags if 3+ reports) ──────────────
CREATE OR REPLACE FUNCTION public.report_roast(p_roast_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_count INT;
BEGIN
  -- Insert the report (ignore if already reported by this user)
  INSERT INTO public.reports (roast_id, reporter_id, reason)
  VALUES (p_roast_id, auth.uid(), p_reason)
  ON CONFLICT (roast_id, reporter_id) DO NOTHING;

  -- Count total reports for this roast
  SELECT COUNT(*) INTO v_report_count FROM public.reports WHERE roast_id = p_roast_id;

  -- Auto-flag if it hits 3 reports
  IF v_report_count >= 3 THEN
    UPDATE public.roasts SET is_flagged = true WHERE id = p_roast_id;
  END IF;
END;
$$;

-- ── 5. Get User's Blocklist RPC (Helper for frontend) ───────────
CREATE OR REPLACE FUNCTION public.get_my_blocks()
RETURNS TABLE (blocked_user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT blocked_id FROM public.blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM public.blocks WHERE blocked_id = auth.uid();
END;
$$;
