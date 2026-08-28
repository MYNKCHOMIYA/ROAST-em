-- ================================================================
-- ROAST'em — Complete Database Migration v1
-- Run this ENTIRE script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new
-- ================================================================

-- ── 1. PROFILES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle        TEXT NOT NULL UNIQUE,
  aura_points   INTEGER NOT NULL DEFAULT 200,
  avatar_url    TEXT,
  bio           TEXT,
  phone_hash    TEXT UNIQUE,
  device_hash   TEXT,
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── 2. ROASTS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roasts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_text            TEXT,
  media_url               TEXT,
  media_type              TEXT CHECK (media_type IN ('image', 'video', 'gif', 'none')) DEFAULT 'none',
  aura_gained             INTEGER NOT NULL DEFAULT 0,
  is_battle               BOOLEAN NOT NULL DEFAULT FALSE,
  parent_roast_id         UUID REFERENCES public.roasts(id),
  comeback_window_ends_at TIMESTAMPTZ,
  is_flagged              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roasts_select_all" ON public.roasts
  FOR SELECT USING (true);

CREATE POLICY "roasts_insert_auth" ON public.roasts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "roasts_update_own" ON public.roasts
  FOR UPDATE USING (auth.uid() = author_id);

-- ── 3. AURA TRANSACTIONS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aura_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roast_id       UUID NOT NULL REFERENCES public.roasts(id) ON DELETE CASCADE,
  from_user_id   UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id     UUID NOT NULL REFERENCES public.profiles(id),
  burned_user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount         INTEGER NOT NULL DEFAULT 10,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.aura_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "txns_select_own" ON public.aura_transactions
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    auth.uid() = burned_user_id
  );

-- ── 4. FOLLOWS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_all" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "follows_manage_own" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- ── 5. TRANSFER_AURA RPC (ACID-safe economy function) ────────────
CREATE OR REPLACE FUNCTION public.transfer_aura(
  p_roast_id    UUID,
  p_from_user   UUID,
  p_to_user     UUID,
  p_burned_user UUID,
  p_amount      INTEGER DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Guard: liker must have enough aura
  IF (SELECT aura_points FROM public.profiles WHERE id = p_from_user) < p_amount THEN
    RAISE EXCEPTION 'Not enough Aura to like this roast';
  END IF;

  -- 1. Deduct from liker
  UPDATE public.profiles SET aura_points = aura_points - p_amount WHERE id = p_from_user;
  -- 2. Credit the roaster
  UPDATE public.profiles SET aura_points = aura_points + p_amount WHERE id = p_to_user;
  -- 3. Burn from the roasted target (floor at 0)
  UPDATE public.profiles
    SET aura_points = GREATEST(0, aura_points - p_amount)
    WHERE id = p_burned_user;
  -- 4. Log the immutable transaction
  INSERT INTO public.aura_transactions
    (roast_id, from_user_id, to_user_id, burned_user_id, amount)
    VALUES (p_roast_id, p_from_user, p_to_user, p_burned_user, p_amount);
  -- 5. Update roast aura tally
  UPDATE public.roasts SET aura_gained = aura_gained + p_amount WHERE id = p_roast_id;
END;
$$;

-- ── 6. AUTO-UPDATED_AT TRIGGER ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 7. WEEKLY DECAY FUNCTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_weekly_aura_decay(
  p_decay_rate NUMERIC DEFAULT 0.015
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET aura_points = GREATEST(200, FLOOR(aura_points * (1 - p_decay_rate))::INTEGER)
  WHERE is_banned = FALSE;
END;
$$;

-- ── 8. REALTIME ──────────────────────────────────────────────────
-- Enable realtime on roasts table (for live feed updates and comeback window)
ALTER PUBLICATION supabase_realtime ADD TABLE public.roasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ── Done! ─────────────────────────────────────────────────────────
-- Run: SELECT * FROM public.profiles LIMIT 1;
-- Should return empty result (not an error) if setup succeeded.
