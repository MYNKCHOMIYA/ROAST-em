-- Migration V5: Shield mechanic + profile bio edit
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new

-- ── 1. Add shield_until to profiles ──────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shield_until TIMESTAMPTZ;

-- ── 2. Upgrade transfer_aura to respect shields ───────────────────
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
DECLARE
  v_shielded BOOLEAN;
BEGIN
  -- Guard: liker must have enough aura
  IF (SELECT aura_points FROM public.profiles WHERE id = p_from_user) < p_amount THEN
    RAISE EXCEPTION 'Not enough Aura to like this roast';
  END IF;

  -- Check if the burned user has an active shield
  SELECT (shield_until IS NOT NULL AND shield_until > NOW())
    INTO v_shielded
    FROM public.profiles WHERE id = p_burned_user;

  -- 1. Deduct from liker
  UPDATE public.profiles SET aura_points = aura_points - p_amount WHERE id = p_from_user;
  -- 2. Credit the roaster
  UPDATE public.profiles SET aura_points = aura_points + p_amount WHERE id = p_to_user;
  -- 3. Burn from the target ONLY if not shielded
  IF NOT v_shielded THEN
    UPDATE public.profiles
      SET aura_points = GREATEST(0, aura_points - p_amount)
      WHERE id = p_burned_user;
  END IF;
  -- 4. Log transaction
  INSERT INTO public.aura_transactions
    (roast_id, from_user_id, to_user_id, burned_user_id, amount)
    VALUES (p_roast_id, p_from_user, p_to_user, p_burned_user, p_amount);
  -- 5. Update roast aura tally
  UPDATE public.roasts SET aura_gained = aura_gained + p_amount WHERE id = p_roast_id;
END;
$$;

-- ── 3. activate_shield RPC — costs 50 aura, lasts 48h ────────────
CREATE OR REPLACE FUNCTION public.activate_shield()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aura INTEGER;
BEGIN
  SELECT aura_points INTO v_aura FROM public.profiles WHERE id = auth.uid();
  IF v_aura < 50 THEN
    RAISE EXCEPTION 'Need at least 50 Aura to activate a Shield';
  END IF;
  UPDATE public.profiles
    SET aura_points = aura_points - 50,
        shield_until = NOW() + INTERVAL '48 hours'
    WHERE id = auth.uid();
END;
$$;

-- Done! Test:
-- SELECT handle, aura_points, shield_until FROM public.profiles;
