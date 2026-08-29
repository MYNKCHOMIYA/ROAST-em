import { createClient } from '@/lib/supabase/client'
import type { Profile, Roast, RoastWithProfiles } from '@/lib/types'

/** Fetch paginated roasts for the global/trending feed */
export async function fetchGlobalFeed(page = 0, limit = 20): Promise<RoastWithProfiles[]> {
  const supabase = createClient()
  
  // Get blocklist to filter out
  const { data: blocks } = await supabase.rpc('get_my_blocks')
  const blockedIds = (blocks ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id)

  let query = supabase
    .from('roasts')
    .select(`
      *,
      author:profiles!roasts_author_id_fkey ( id, handle, aura_points, avatar_url ),
      target:profiles!roasts_target_id_fkey ( id, handle, aura_points, avatar_url )
    `)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (blockedIds.length > 0) {
    // Exclude roasts where author or target is blocked
    const blockListStr = `(${blockedIds.join(',')})`
    query = query.not('author_id', 'in', blockListStr).not('target_id', 'in', blockListStr)
  }

  const { data, error } = await query
  if (error) throw error
  // Filter out soft-deleted authors
  return ((data ?? []) as RoastWithProfiles[]).filter(r => r.author !== null && !r.author.is_deleted)
}

/** Fetch feed for a specific user's following list */
export async function fetchFollowingFeed(userId: string, page = 0, limit = 20): Promise<RoastWithProfiles[]> {
  const supabase = createClient()

  // Get IDs of people this user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = (follows ?? []).map((f) => f.following_id)
  if (followingIds.length === 0) return fetchGlobalFeed(page, limit)

  // Get blocklist to filter out
  const { data: blocks } = await supabase.rpc('get_my_blocks')
  const blockedIds = (blocks ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id)

  let query = supabase
    .from('roasts')
    .select(`
      *,
      author:profiles!roasts_author_id_fkey ( id, handle, aura_points, avatar_url ),
      target:profiles!roasts_target_id_fkey ( id, handle, aura_points, avatar_url )
    `)
    .in('author_id', followingIds)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (blockedIds.length > 0) {
    const blockListStr = `(${blockedIds.join(',')})`
    query = query.not('author_id', 'in', blockListStr).not('target_id', 'in', blockListStr)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as RoastWithProfiles[]).filter(r => r.author !== null)
}

/** Like a roast — triggers ACID aura transfer via RPC */
export async function likeRoast(roastId: string, fromUserId: string, toUserId: string, burnedUserId: string, amount = 10) {
  const supabase = createClient()
  const { error } = await supabase.rpc('transfer_aura', {
    p_roast_id: roastId,
    p_from_user: fromUserId,
    p_to_user: toUserId,
    p_burned_user: burnedUserId,
    p_amount: amount,
  })
  if (error) throw error
}

/** Get the current user's profile */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as Profile | null
}

/** Search for a profile by handle */
export async function searchByHandle(query: string): Promise<Profile[]> {
  const supabase = createClient()
  const cleanQuery = query.replace(/^@/, '')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, aura_points, avatar_url')
    .ilike('handle', `%${cleanQuery}%`)
    .limit(10)
  if (error) throw error
  return (data ?? []) as Profile[]
}

/** Get a list of IDs the current user is following */
export async function getMyFollowingIds(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  return (data ?? []).map((f) => f.following_id)
}

/** Get recommended profiles to follow */
export async function getRecommendedProfiles(userId: string, limit = 5): Promise<Profile[]> {
  const supabase = createClient()
  
  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', userId)
  const followingIds = (follows ?? []).map(f => f.following_id)
  
  const excludeIds = [...followingIds, userId]
  const excludeStr = `(${excludeIds.join(',')})`
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', excludeStr)
    .order('aura_points', { ascending: false })
    .limit(limit)
    
  if (error) throw error
  return (data ?? []) as Profile[]
}

/** Create a new roast — goes through server API for rate limiting + moderation */
export async function createRoast(
  _authorId: string,  // kept for API compatibility; server reads auth from cookie
  targetId: string,
  content: string,
  parentRoastId?: string,
): Promise<{ roastId: string; remaining: number }> {
  const res = await fetch('/api/roasts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, content, parentRoastId }),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to post roast')
  }

  return { roastId: json.roastId, remaining: json.remaining }
}

/** Report a roast */
export async function reportRoast(roastId: string, reason: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('report_roast', {
    p_roast_id: roastId,
    p_reason: reason,
  })
  if (error) throw error
}

/** Toggle block user (returns true if blocked, false if unblocked) */
export async function toggleBlockUser(targetId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('toggle_block', {
    p_target_id: targetId,
  })
  if (error) throw error
  return data as boolean
}
