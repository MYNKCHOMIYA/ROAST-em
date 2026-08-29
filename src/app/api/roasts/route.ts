import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Word filter — expand as needed ───────────────────────────────
const BLOCKED_WORDS = [
  'n-word', 'f-word', 'slur1', // Replace with real slurs you want blocked
  // Keep this list in a separate moderation DB for production
]

// ── Simple in-memory rate limiter (per user, resets on deploy) ───
// For production: replace with Redis/Upstash
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5                      // 5 roasts per hour

const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetInMs: RATE_LIMIT_WINDOW_MS }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetInMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetInMs }
  }

  entry.count += 1
  rateLimitStore.set(userId, entry)
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetInMs: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart) }
}

function moderateContent(content: string): { passed: boolean; reason?: string } {
  const lower = content.toLowerCase()

  // Block explicit slurs
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { passed: false, reason: 'Content contains prohibited language.' }
    }
  }

  // Block pure spam (same char repeated 20+ times)
  if (/(.)\1{19,}/.test(content)) {
    return { passed: false, reason: 'Content looks like spam.' }
  }

  // Block URLs (no link spam)
  if (/https?:\/\//i.test(content)) {
    return { passed: false, reason: 'Links are not allowed in roasts.' }
  }

  // Minimum meaningful content
  const words = content.trim().split(/\s+/)
  if (words.length < 3) {
    return { passed: false, reason: 'Roast must be at least 3 words. Make it count.' }
  }

  return { passed: true }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create SSR Supabase client (reads cookies for session)
  let response = NextResponse.next()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: any }[]) => {
        response = NextResponse.next()
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // ── Auth check ─────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limiting ───────────────────────────────────────────────
  const { allowed, remaining, resetInMs } = checkRateLimit(user.id)
  if (!allowed) {
    const resetMins = Math.ceil(resetInMs / 60_000)
    return NextResponse.json(
      { error: `Slow down — you can post 5 roasts per hour. Try again in ${resetMins} min.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetInMs / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // ── Parse body ─────────────────────────────────────────────────
  let body: { targetId: string; content: string; parentRoastId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { targetId, content, parentRoastId } = body

  if (!targetId || !content) {
    return NextResponse.json({ error: 'targetId and content are required' }, { status: 400 })
  }

  if (content.length > 280) {
    return NextResponse.json({ error: 'Roast must be 280 characters or less' }, { status: 400 })
  }

  // Can't roast yourself
  if (targetId === user.id) {
    return NextResponse.json({ error: "You can't roast yourself. That's just sad." }, { status: 400 })
  }

  // ── Content moderation ─────────────────────────────────────────
  const modResult = moderateContent(content)
  if (!modResult.passed) {
    return NextResponse.json({ error: modResult.reason }, { status: 422 })
  }

  // ── Verify target exists ────────────────────────────────────────
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, is_banned')
    .eq('id', targetId)
    .single()

  if (!targetProfile) {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
  }

  if (targetProfile.is_banned) {
    return NextResponse.json({ error: 'Cannot roast a banned user' }, { status: 400 })
  }

  // ── Get author profile ──────────────────────────────────────────
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('id, is_banned')
    .eq('id', user.id)
    .single()

  if (!authorProfile || authorProfile.is_banned) {
    return NextResponse.json({ error: 'Your account is restricted' }, { status: 403 })
  }

  // ── Block check ────────────────────────────────────────────────
  const { data: isBlocked } = await supabase.rpc('get_my_blocks')
  const blockedIds = (isBlocked ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id)
  if (blockedIds.includes(targetId)) {
    return NextResponse.json({ error: 'Cannot interact with this user' }, { status: 403 })
  }
  // ── Set comeback window (2 minutes from now) ────────────────────
  const comebackWindowEndsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

  // ── Insert roast ────────────────────────────────────────────────
  const { data: roast, error: insertError } = await supabase
    .from('roasts')
    .insert({
      author_id: user.id,
      target_id: targetId,
      content_text: content.trim(),
      parent_roast_id: parentRoastId ?? null,
      comeback_window_ends_at: comebackWindowEndsAt,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Roast insert error:', insertError)
    return NextResponse.json({ error: 'Failed to post roast. Try again.' }, { status: 500 })
  }

  // If this was a fireback, mark the parent roast as firebacked and clear the timer
  if (parentRoastId) {
    await supabase.from('roasts').update({
      has_fireback: true,
      comeback_window_ends_at: null
    }).eq('id', parentRoastId)
  }

  return NextResponse.json(
    {
      roastId: roast.id,
      remaining,
      message: 'Roast posted!',
    },
    {
      status: 201,
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(remaining),
      },
    }
  )
}
