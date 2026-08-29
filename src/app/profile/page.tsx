'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Flame, Zap, ArrowLeft, Settings, LogOut, RefreshCw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { handleToColor, formatAura } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Profile, RoastWithProfiles } from '@/lib/types'
import RoastCard from '@/components/RoastCard'
import { FollowListModal } from '@/components/FollowListModal'
import { restoreAccount } from '@/lib/actions/profile'

export default function MyProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roasts, setRoasts] = useState<RoastWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ followers: 0, following: 0, roastsDropped: 0, gotRoasted: 0 })
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [restoring, setRestoring] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleRestore() {
    setRestoring(true)
    await restoreAccount()
    setProfile(prev => prev ? { ...prev, is_deleted: false, deleted_at: null } : prev)
    setRestoring(false)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof) { router.push('/auth/signup'); return }
      setProfile(prof as Profile)

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

      const { data: roastData } = await supabase
        .from('roasts')
        .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
        .eq('author_id', prof.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setRoasts((roastData ?? []) as RoastWithProfiles[])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  const color = handleToColor(profile!.handle)
  const isOnGracePeriod = profile!.is_deleted && profile!.deleted_at !== null
  const daysLeft = isOnGracePeriod
    ? Math.max(0, 15 - Math.floor((Date.now() - new Date(profile!.deleted_at!).getTime()) / 86_400_000))
    : 0

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Grace period banner */}
      {isOnGracePeriod && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,200,60,0.15), rgba(255,60,172,0.1))',
            borderBottom: '1px solid rgba(255,200,60,0.3)',
            padding: '12px 16px',
          }}
        >
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AlertTriangle size={16} style={{ color: '#FFD200', flexShrink: 0 }} />
            <p style={{ fontSize: 13, margin: 0, flex: 1 }}>
              <strong style={{ color: '#FFD200' }}>Account pending deletion</strong>
              <span style={{ color: 'var(--text-secondary)' }}> — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left before permanent wipe</span>
            </p>
            <button
              onClick={handleRestore}
              disabled={restoring}
              style={{
                background: 'rgba(39,201,150,0.15)', border: '1px solid rgba(39,201,150,0.4)',
                color: '#27C996', borderRadius: 'var(--radius-full)',
                padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {restoring
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <RefreshCw size={13} />
              }
              Restore Account
            </button>
          </div>
        </motion.div>
      )}
      <div style={{ height: 140, background: `linear-gradient(135deg, ${color}20, transparent)` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: '100%', gap: 16 }}>
          <button onClick={() => router.push('/feed')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', padding: '7px 14px', cursor: 'pointer', color: 'white', fontSize: 13 }}>
            <ArrowLeft size={15} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>My Profile</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ marginTop: -48, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              background: `${color}25`, border: `3px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 700, color, boxShadow: `0 0 28px ${color}40`,
            }}>
              {profile!.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile!.avatar_url} alt={profile!.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile!.handle[0].toUpperCase()
              }
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleLogout} className="btn-ghost" title="Log Out" style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255, 255, 255, 0.05)' }}>
                <LogOut size={16} />
              </button>
              <a href="/profile/settings" className="btn-ghost" title="Settings" style={{ fontSize: 13, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255, 255, 255, 0.05)' }}>
                <Settings size={16} />
              </a>
              <a href="/profile/edit" className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>
                Edit Profile
              </a>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 10 }}>@{profile!.handle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="aura-badge" style={{ fontSize: 14, padding: '6px 14px', color, borderColor: `${color}40`, background: `${color}12` }}>
              <Zap size={14} style={{ color }} />
              <span style={{ fontWeight: 800 }}>{formatAura(profile!.aura_points)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>aura</span>
            </div>
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

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 14 }}>🔥 Your Roasts</div>

        {roasts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card"
            style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>You haven&apos;t roasted anyone yet. The arena awaits.</p>
            <a href="/roast/new" className="btn-primary" style={{ fontSize: 13 }}>
              <Flame size={14} /> Drop your first roast
            </a>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {roasts.map((roast) => (
              <RoastCard key={roast.id} roast={roast} currentUser={profile} />
            ))}
          </div>
        )}
      </div>
      
      {/* Follow Modal */}
      {followModal && (
        <FollowListModal
          userId={profile!.id}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </main>
  )
}
