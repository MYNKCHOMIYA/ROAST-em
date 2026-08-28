# ROAST'em - Database Schema (Supabase / PostgreSQL)

## Overview
All Aura Point transfers MUST be handled via Postgres RPC (Stored Procedures/Functions) to guarantee ACID compliance. NEVER do point math on the client side.

---

## Tables

### `profiles`
Extends the built-in Supabase `auth.users` table. One row per user.

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle        TEXT NOT NULL UNIQUE,           -- ANEXT_PUBLIC_SUPABASE_URL=https://bikvqaledjvxdhiimoun.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_spkXcW-tNLCybWAT37aAuQ_eaBqOGk6nonymous display name (e.g., "ShadowFlame42")
  aura_points   INTEGER NOT NULL DEFAULT 200,    -- Starter balance: 200 points
  avatar_url    TEXT,
  bio           TEXT,
  phone_hash    TEXT UNIQUE,                     -- Hashed phone number (for 1-account enforcement)
  device_hash   TEXT UNIQUE,                     -- Device fingerprint hash
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

---

### `roasts`
Every post on the platform is a "Roast" directed at a target user.

```sql
CREATE TABLE public.roasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_text    TEXT,                          -- Text content of the roast
  media_url       TEXT,                          -- URL to image/video/gif in Supabase Storage
  media_type      TEXT CHECK (media_type IN ('image', 'video', 'gif', 'none')) DEFAULT 'none',
  aura_gained     INTEGER NOT NULL DEFAULT 0,    -- Total aura earned on this post
  is_battle       BOOLEAN NOT NULL DEFAULT FALSE,-- True if this is a comeback in a roast battle
  parent_roast_id UUID REFERENCES public.roasts(id), -- For comeback roasts
  comeback_window_ends_at TIMESTAMPTZ,           -- 2-min window deadline
  is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.roasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view roasts" ON public.roasts FOR SELECT USING (true);
CREATE POLICY "Auth users can create roasts" ON public.roasts FOR INSERT WITH CHECK (auth.uid() = author_id);
```

---

### `aura_transactions`
An immutable ledger of every aura point transfer. Never update or delete rows here.

```sql
CREATE TABLE public.aura_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roast_id      UUID NOT NULL REFERENCES public.roasts(id) ON DELETE CASCADE,
  from_user_id  UUID NOT NULL REFERENCES public.profiles(id), -- Who gave aura (the liker)
  to_user_id    UUID NOT NULL REFERENCES public.profiles(id), -- Who received aura (roaster)
  burned_user_id UUID NOT NULL REFERENCES public.profiles(id),-- Who lost aura (the roasted target)
  amount        INTEGER NOT NULL DEFAULT 10,                  -- Points transferred
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.aura_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.aura_transactions 
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id OR auth.uid() = burned_user_id);
```

---

### `follows`
Social graph for the following system.

```sql
CREATE TABLE public.follows (
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Auth users manage own follows" ON public.follows 
  FOR ALL USING (auth.uid() = follower_id);
```

---

## Critical RPC Functions (Stored Procedures)

### `transfer_aura` — The Core Economy Function
This function handles all point transfers atomically. It MUST be called via Supabase RPC.

```sql
CREATE OR REPLACE FUNCTION public.transfer_aura(
  p_roast_id    UUID,
  p_from_user   UUID,  -- The liker
  p_to_user     UUID,  -- The roaster (gains aura)
  p_burned_user UUID,  -- The target (loses aura)
  p_amount      INTEGER DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Deduct from liker
  UPDATE public.profiles SET aura_points = aura_points - p_amount WHERE id = p_from_user;
  -- 2. Credit the roaster
  UPDATE public.profiles SET aura_points = aura_points + p_amount WHERE id = p_to_user;
  -- 3. Burn from the roasted target
  UPDATE public.profiles SET aura_points = aura_points - p_amount WHERE id = p_burned_user;
  -- 4. Log the transaction
  INSERT INTO public.aura_transactions (roast_id, from_user_id, to_user_id, burned_user_id, amount)
    VALUES (p_roast_id, p_from_user, p_to_user, p_burned_user, p_amount);
  -- 5. Update roast's total aura gained
  UPDATE public.roasts SET aura_gained = aura_gained + p_amount WHERE id = p_roast_id;
END;
$$;
```

### `apply_weekly_aura_decay` — Anti-Inflation CRON Job
```sql
CREATE OR REPLACE FUNCTION public.apply_weekly_aura_decay(p_decay_rate NUMERIC DEFAULT 0.015)
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
-- NOTE: Schedule this via pg_cron in Supabase or a Vercel CRON job weekly.
```
