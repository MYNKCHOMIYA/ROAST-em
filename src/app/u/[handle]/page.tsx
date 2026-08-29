'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, ArrowLeft, Calendar, Shield, UserPlus, UserMinus, Loader2, AlertTriangle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { handleToColor, formatAura, timeAgo } from '@/lib/utils'
import RoastCard from '@/components/RoastCard'
import type { Profile, RoastWithProfiles } from '@/lib/types'
import { FollowListModal } from '@/components/FollowListModal'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const handle = params.handle as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [roasts, setRoasts] = useState<RoastWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [tab, setTab] = useState<'roasts' | 'roasted'>('roasts')
  const [notFound, setNotFound] = useState(false)
  const [stats, setStats] = useState({ followers: 0, following: 0, roastsDropped: 0, gotRoasted: 0 })
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Load current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: cu } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setCurrentUser(cu as Profile)
      }

      // Load target profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .single()

      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof as Profile)

      // Fetch stats
      const [{ count: followersCount }, { count: followingCount }, { count: roastsDroppedCount }, { count: gotRoastedCount }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', prof.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', prof.id),
        supabase.from('roasts').select('*', { count: 'exact', head: true }).eq('author_id', prof.id).eq('is_flagged', false),
        supabase.from('roasts').select('*', { count: 'exact', head: true }).eq('target_id', prof.id).eq('is_flagged', false),
      ])

      setStats({
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
        roastsDropped: roastsDroppedCount ?? 0,
        gotRoasted: gotRoastedCount ?? 0,
      })

      // Check follow status
      if (user) {
        const { data: follow } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', prof.id)
          .single()
        setIsFollowing(!!follow)

        const { data: block } = await supabase
          .from('blocks')
          .select('blocker_id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', prof.id)
          .single()
        setIsBlocked(!!block)
      }

      // Load roasts authored by this user
      const { data: roastData } = await supabase
        .from('roasts')
        .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
        .eq('author_id', prof.id)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(20)

      setRoasts((roastData ?? []) as RoastWithProfiles[])
      setLoading(false)
    }
    load()
  }, [handle])

  async function loadRoasted() {
    if (!profile) return
    const supabase = createClient()
    const { data } = await supabase
      .from('roasts')
      .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
      .eq('target_id', profile.id)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(20)
    setRoasts((data ?? []) as RoastWithProfiles[])
  }

  async function handleFollow() {
    if (!currentUser || !profile) return
    setFollowLoading(true)
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  async function handleBlock() {
    if (!currentUser || !profile) return
    setBlockLoading(true)
    try {
      const { toggleBlockUser } = await import('@/lib/api')
      const blocked = await toggleBlockUser(profile.id)
      setIsBlocked(blocked)
      if (blocked) setIsFollowing(false) // Blocking removes follow
    } catch (e) {
      console.error('Failed to block/unblock', e)
    }
    setBlockLoading(false)
  }

  const isOwnProfile = currentUser?.id === profile?.id
  const avatarColor = profile ? handleToColor(profile.handle) : 'var(--aura-pink)'

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 56 }}>👻</div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>@{handle} doesn&apos;t exist</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Maybe they got roasted out of existence</p>
        <button onClick={() => router.push('/feed')} className="btn-ghost" style={{ fontSize: 14 }}>← Back to Feed</button>
      </main>
    )
  }

  // Hard-block if profile is past grace period (shouldn't happen but just in case)
  if (profile!.is_deleted) {
    const deletedAt = new Date(profile!.deleted_at!).getTime()
    const isExpired = Date.now() - deletedAt > 15 * 86_400_000
    if (isExpired) {
      return (
        <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 56 }}>💀</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>This account is gone</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Permanently deleted from the arena</p>
          <button onClick={() => router.push('/feed')} className="btn-ghost" style={{ fontSize: 14 }}>← Back to Feed</button>
        </main>
      )
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Pending deletion banner */}
      {profile!.is_deleted && (
        <div style={{ background: 'var(--aura-pink)', color: 'white', padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: 8 }} />
          This account is pending deletion and will be removed soon.
        </div>
      )}

      {/* Background accent */}
      <div style={{ height: 160, background: `linear-gradient(135deg, ${avatarColor}18, transparent)`, position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px', color: avatarColor,
        }} />
        {/* Back button */}
        <button onClick={() => router.back()}
          style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', padding: '7px 14px', cursor: 'pointer', color: 'white', fontSize: 13 }}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
        {/* Profile header */}
        <div style={{ marginTop: -52, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
              background: `${avatarColor}25`, border: `3px solid ${avatarColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 700, color: avatarColor,
              boxShadow: `0 0 32px ${avatarColor}40`,
            }}>
              {profile!.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile!.avatar_url} alt={profile!.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile!.handle[0].toUpperCase()
              }
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {isOwnProfile ? (
                <a href="/profile/edit" className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>Edit Profile</a>
              ) : (
                <>
                  <a href={`/roast/new?targetHandle=${profile!.handle}`} className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
                    <Flame size={14} /> Roast
                  </a>
                  <button
                    id={`follow-${profile!.handle}`}
                    onClick={handleFollow}
                    disabled={followLoading || isBlocked}
                    className="btn-ghost"
                    style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {followLoading
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />
                    }
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={blockLoading}
                    className="btn-ghost"
                    style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--aura-pink)', borderColor: 'var(--border-subtle)' }}
                  >
                    {blockLoading
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Shield size={14} />
                    }
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Handle & info */}
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: avatarColor }}>
            @{profile!.handle}
          </h1>
          {profile!.bio && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>{profile!.bio}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Aura */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${avatarColor}15`, border: `1px solid ${avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} style={{ color: avatarColor }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: avatarColor, lineHeight: 1 }}>{formatAura(profile!.aura_points)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>AURA</div>
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />

            {/* Joined */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Calendar size={12} />
              Joined {new Date(profile!.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>

            {/* Banned badge */}
            {profile!.is_banned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--aura-pink)', background: 'rgba(255,60,172,0.1)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,60,172,0.3)' }}>
                <Shield size={11} /> Banned
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 14 }}>
            <div onClick={() => setFollowModal('followers')} style={{ cursor: 'pointer' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{stats.followers}</strong> <span style={{ color: 'var(--text-secondary)' }}>Followers</span>
            </div>
            <div onClick={() => setFollowModal('following')} style={{ cursor: 'pointer' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{stats.following}</strong> <span style={{ color: 'var(--text-secondary)' }}>Following</span>
            </div>
            <div><strong style={{ color: 'var(--text-primary)' }}>{stats.roastsDropped}</strong> <span style={{ color: 'var(--text-secondary)' }}>Roasts</span></div>
            <div><strong style={{ color: 'var(--text-primary)' }}>{stats.gotRoasted}</strong> <span style={{ color: 'var(--text-secondary)' }}>Roasted</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          {(['roasts', 'roasted'] as const).map((t) => (
            <button key={t} id={`profile-tab-${t}`}
              onClick={() => { setTab(t); if (t === 'roasted') loadRoasted(); else {
                // reload authored roasts
                const supabase = createClient()
                supabase.from('roasts').select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)').eq('author_id', profile!.id).eq('is_flagged', false).order('created_at', { ascending: false }).limit(20).then(({ data }) => setRoasts((data ?? []) as RoastWithProfiles[]))
              }}}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t ? 700 : 400,
                color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${tab === t ? avatarColor : 'transparent'}`,
                transition: 'all 0.2s', fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {t === 'roasts' ? '🔥 Roasts Dropped' : '😵 Got Roasted'}
            </button>
          ))}
        </div>

        {/* Roast list */}
        <AnimatePresence mode="popLayout">
          {roasts.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'roasts' ? '🌟' : '🛡️'}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {tab === 'roasts' ? 'No roasts dropped yet.' : 'Nobody dared to roast them yet.'}
              </p>
              {isOwnProfile && tab === 'roasts' && (
                <a href="/roast/new" className="btn-primary" style={{ marginTop: 16, fontSize: 13, display: 'inline-flex' }}>
                  <Flame size={14} /> Drop your first roast
                </a>
              )}
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {roasts.map((roast) => (
                <RoastCard key={roast.id} roast={roast} currentUser={currentUser} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Follow Modal */}
      {followModal && profile && (
        <FollowListModal
          userId={profile.id}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </main>
  )
}
