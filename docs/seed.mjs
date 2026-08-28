/**
 * Seed script — creates 5 fake profiles in Supabase so you have targets to roast.
 * Run: node docs/seed.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Read .env.local manually
const env = readFileSync('.env.local', 'utf-8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const key = (env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1])?.trim()

if (!url || !key) { console.error('❌ Missing Supabase env vars in .env.local'); process.exit(1) }

const supabase = createClient(url, key)

// We need a service role key to bypass RLS for seed data.
// Since we only have the anon key, we'll insert via the Supabase REST API with a workaround.
// The profiles table INSERT policy requires auth.uid() = id, so we need real auth users.
// Instead, let's use the Supabase dashboard or provide SQL to seed directly.

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ROAST'em — Seed Fake Profiles
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The profiles table uses Row Level Security which requires
real authenticated users (auth.uid() = id).

To seed fake targets to roast, run this SQL in your
Supabase SQL Editor:

  https://supabase.com/dashboard/project/bikvqaledjvxdhiimoun/sql/new

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Copy-paste the following SQL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Create fake auth users first (bypasses RLS)
INSERT INTO auth.users (id, phone, created_at, updated_at, is_anonymous)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+10000000001', NOW(), NOW(), false),
  ('00000000-0000-0000-0000-000000000002', '+10000000002', NOW(), NOW(), false),
  ('00000000-0000-0000-0000-000000000003', '+10000000003', NOW(), NOW(), false),
  ('00000000-0000-0000-0000-000000000004', '+10000000004', NOW(), NOW(), false),
  ('00000000-0000-0000-0000-000000000005', '+10000000005', NOW(), NOW(), false)
ON CONFLICT DO NOTHING;

-- Then insert their profiles
INSERT INTO public.profiles (id, handle, aura_points, bio)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'NeonGhostX',    1240, 'I roast breakfast'),
  ('00000000-0000-0000-0000-000000000002', 'AcidWraith99',   890, 'Your opinion is invalid'),
  ('00000000-0000-0000-0000-000000000003', 'BlazeCipher',    450, 'Certified roast machine'),
  ('00000000-0000-0000-0000-000000000004', 'VoidPunch42',    200, 'New to the arena'),
  ('00000000-0000-0000-0000-000000000005', 'ToxicLegend',   3750, 'Most roasted, most feared')
ON CONFLICT DO NOTHING;

SELECT handle, aura_points FROM public.profiles ORDER BY aura_points DESC;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
