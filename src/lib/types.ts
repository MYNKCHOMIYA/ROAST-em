/** Supabase DB type definitions for ROAST'em */

export interface Profile {
  id: string
  handle: string
  aura_points: number
  avatar_url: string | null
  bio: string | null
  phone_hash: string | null
  is_banned: boolean
  is_deleted: boolean
  deleted_at: string | null
  shield_until: string | null
  created_at: string
  updated_at: string
}

export interface Roast {
  id: string
  author_id: string
  target_id: string
  content_text: string | null
  media_url: string | null
  media_type: 'image' | 'video' | 'gif' | 'none'
  aura_gained: number
  is_battle: boolean
  parent_roast_id: string | null
  comeback_window_ends_at: string | null
  is_flagged: boolean
  has_fireback: boolean
  comments_count: number
  created_at: string
}

/** Roast with joined profile data (from SELECT with foreign key joins) */
export interface RoastWithProfiles extends Roast {
  author: Pick<Profile, 'id' | 'handle' | 'aura_points' | 'avatar_url' | 'is_deleted'>
  target: Pick<Profile, 'id' | 'handle' | 'aura_points' | 'avatar_url' | 'is_deleted'>
}

export interface AuraTransaction {
  id: string
  roast_id: string
  from_user_id: string
  to_user_id: string
  burned_user_id: string
  amount: number
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Comment {
  id: string
  roast_id: string
  author_id: string
  content_text: string
  likes_count: number
  created_at: string
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, 'id' | 'handle' | 'avatar_url' | 'aura_points'>
}

export interface Notification {
  id: string
  user_id: string
  type: 'roasted' | 'liked' | 'comeback' | 'followed' | 'milestone' | 'mention' | 'reward_stopped' | 'commented'
  from_user_id: string
  roast_id: string | null
  is_read: boolean
  created_at: string
  from_user?: Pick<Profile, 'id' | 'handle' | 'aura_points' | 'avatar_url'>
}

export interface Block {
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface Report {
  id: string
  roast_id: string
  reporter_id: string
  reason: string
  created_at: string
}
