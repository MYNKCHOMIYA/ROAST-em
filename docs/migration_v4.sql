-- Migration V4: Notifications Table + Realtime
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new

-- ── 1. NOTIFICATIONS TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('roasted', 'liked', 'comeback', 'followed')),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roast_id    UUID REFERENCES public.roasts(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only the recipient can read/update their own notifications
CREATE POLICY "notifs_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifs_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert (via SECURITY DEFINER functions or triggers)
CREATE POLICY "notifs_insert_service" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Index for fast unread counts
CREATE INDEX IF NOT EXISTS notifs_user_unread_idx
  ON public.notifications (user_id, is_read)
  WHERE is_read = FALSE;

-- ── 2. TRIGGER: Auto-notify on new roast ─────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_roast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify the target they got roasted
  INSERT INTO public.notifications (user_id, type, from_user_id, roast_id)
  VALUES (NEW.target_id, 'roasted', NEW.author_id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roast_notification_trigger ON public.roasts;
CREATE TRIGGER roast_notification_trigger
  AFTER INSERT ON public.roasts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_roast();

-- ── 3. TRIGGER: Auto-notify on aura like (transaction) ───────────
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify the roaster they received aura
  INSERT INTO public.notifications (user_id, type, from_user_id, roast_id)
  VALUES (NEW.to_user_id, 'liked', NEW.from_user_id, NEW.roast_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS like_notification_trigger ON public.aura_transactions;
CREATE TRIGGER like_notification_trigger
  AFTER INSERT ON public.aura_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- ── 4. TRIGGER: Auto-notify on follow ────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, from_user_id)
  VALUES (NEW.following_id, 'followed', NEW.follower_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS follow_notification_trigger ON public.follows;
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- ── 5. RPC: Mark all notifications read ──────────────────────────
CREATE OR REPLACE FUNCTION public.mark_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$;

-- ── 6. Enable Realtime on notifications ──────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Done! Test: SELECT * FROM public.notifications LIMIT 5;
