'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, Crown, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { handleToColor, formatAura } from '@/lib/utils'
import type { Profile } from '@/lib/types'

type LeaderboardTab = 'all-time' | 'weekly'

const MEDAL = ['🥇', '🥈', '🥉']
const PODIUM_HEIGHTS = [140, 110, 90] // px heights for 1st, 2nd, 3rd

function PodiumBlock({ profile, rank }: { profile: Profile; rank: number }) {
  const color = handleToColor(profile.handle)
  const height = PODIUM_HEIGHTS[rank] ?? 70
  const isFirst = rank === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
    >
      {/* Avatar */}
      <a href={`/u/${profile.handle}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: isFirst ? 64 : 52, height: isFirst ? 64 : 52, borderRadius: '50%',
            background: `${color}20`, border: `${isFirst ? 3 : 2}px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isFirst ? 26 : 20, fontWeight: 700, color,
            boxShadow: isFirst ? `0 0 28px ${color}60` : `0 0 16px ${color}30`,
          }}>
            {profile.handle[0].toUpperCase()}
          </div>
          {isFirst && (
            <motion.div
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 20 }}
            >
              👑
            </motion.div>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{profile.handle}
        </span>
        <div className="aura-badge" style={{ fontSize: 11, padding: '2px 10px', color, borderColor: `${color}40`, background: `${color}15` }}>
          <Zap size={9} /> {formatAura(profile.aura_points)}
        </div>
      </a>

      {/* Podium block */}
      <div style={{
        width: '100%', height, marginTop: 10, borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        background: `linear-gradient(180deg, ${color}30, ${color}10)`,
        border: `1px solid ${color}40`, borderBottom: 'none',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10,
        fontSize: isFirst ? 22 : 18,
      }}>
        {MEDAL[rank] ?? rank + 1}
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ profile, rank, currentUserId }: { profile: Profile; rank: number; currentUserId?: string }) {
  const color = handleToColor(profile.handle)
  const isCurrentUser = profile.id === currentUserId
  const isShielded = profile.shield_until && new Date(profile.shield_until) > new Date()

  return (
    <motion.a
      href={`/u/${profile.handle}`}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.04, 0.5) }}
      className="glass-card"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        textDecoration: 'none',
        borderColor: isCurrentUser ? `${color}50` : 'var(--border-subtle)',
        background: isCurrentUser ? `${color}08` : undefined,
        transition: 'all 0.2s',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 32, flexShrink: 0, textAlign: 'center',
        fontSize: rank < 3 ? 18 : 13,
        fontWeight: rank < 3 ? 700 : 500,
        color: rank < 3 ? color : 'var(--text-secondary)',
        fontFamily: rank >= 3 ? 'Space Mono, monospace' : undefined,
      }}>
        {rank < 3 ? MEDAL[rank] : `#${rank + 1}`}
      </div>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: `${color}20`, border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color,
      }}>
        {profile.handle[0].toUpperCase()}
      </div>

      {/* Handle + you badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color }}>@{profile.handle}</span>
          {isCurrentUser && (
            <span style={{ fontSize: 10, color: 'white', background: 'var(--aura-pink)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>you</span>
          )}
          {isShielded && (
            <span title="Shielded — aura loss blocked for 48h" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#56CCF2', background: 'rgba(86,204,242,0.12)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              <Shield size={9} /> shielded
            </span>
          )}
        </div>
      </div>

      {/* Aura */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <Zap size={13} style={{ color: 'var(--aura-yellow)' }} />
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--aura-yellow)' }}>
          {formatAura(profile.aura_points)}
        </span>
      </div>
    </motion.a>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<LeaderboardTab>('all-time')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return }
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_banned', false)
        .order('aura_points', { ascending: false })
        .limit(50)

      const list = (data ?? []) as Profile[]
      setUsers(list)

      if (user) {
        const rank = list.findIndex((p) => p.id === user.id)
        setCurrentUserRank(rank >= 0 ? rank + 1 : null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="glow-orb" style={{ width: 500, height: 500, background: 'var(--aura-yellow)', top: '-15%', left: '50%', opacity: 0.05 }} />
        <div className="glow-orb" style={{ width: 350, height: 350, background: 'var(--aura-pink)', bottom: '10%', right: '-5%', opacity: 0.07, animationDelay: '5s' }} />
      </div>

      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 58 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={18} style={{ color: 'var(--aura-yellow)' }} />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Leaderboard</span>
          </div>
          {currentUserRank && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace' }}>
              you: <strong style={{ color: 'var(--aura-yellow)' }}>#{currentUserRank}</strong>
            </span>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 80px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '20px 0 24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 4 }}>
          {(['all-time', 'weekly'] as const).map((t) => (
            <button key={t} id={`lb-tab-${t}`} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
                background: tab === t ? 'var(--bg-glass)' : 'transparent',
                border: `1px solid ${tab === t ? 'var(--border-subtle)' : 'transparent'}`,
                cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400,
                color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s', fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {t === 'all-time' ? '🏆 All-Time' : '📅 This Week'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={28} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Flame size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No roasters yet. Be the first to earn Aura!</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 24,
                padding: '24px 12px 0',
              }}>
                {/* Reorder: 2nd, 1st, 3rd for visual podium */}
                {[top3[1], top3[0], top3[2]].map((profile, visualIdx) => {
                  if (!profile) return <div key={visualIdx} style={{ flex: 1 }} />
                  const actualRank = top3.indexOf(profile)
                  return <PodiumBlock key={profile.id} profile={profile} rank={actualRank} />
                })}
              </div>
            )}

            {/* Rows 4–50 */}
            <AnimatePresence>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rest.map((profile, i) => (
                  <LeaderboardRow
                    key={profile.id}
                    profile={profile}
                    rank={i + 3}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  )
}
