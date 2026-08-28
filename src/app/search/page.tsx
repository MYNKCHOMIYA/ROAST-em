'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Flame, ArrowLeft, Zap, Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { handleToColor, formatAura } from '@/lib/utils'
import type { Profile } from '@/lib/types'

function UserRow({ user, onRoast, onFollow }: { user: Profile; onRoast: () => void; onFollow: () => void }) {
  const color = handleToColor(user.handle)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      {/* Avatar */}
      <a href={`/u/${user.handle}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `${color}20`, border: `2px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color,
        }}>
          {user.handle[0].toUpperCase()}
        </div>
      </a>

      {/* Info */}
      <a href={`/u/${user.handle}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color, marginBottom: 3 }}>@{user.handle}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={11} style={{ color: 'var(--aura-yellow)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatAura(user.aura_points)} aura</span>
        </div>
      </a>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onFollow}
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <UserPlus size={12} /> Follow
        </button>
        <button onClick={onRoast}
          className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
          <Flame size={12} /> Roast
        </button>
      </div>
    </motion.div>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [trending, setTrending] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Load current user + trending on mount
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      // Trending = top aura holders
      const { data } = await supabase
        .from('profiles')
        .select('id, handle, aura_points, avatar_url, bio, phone_hash, is_banned, created_at, updated_at')
        .order('aura_points', { ascending: false })
        .neq('id', user?.id ?? '')
        .limit(10)
      setTrending((data ?? []) as Profile[])
      setTrendingLoading(false)
    }
    init()
  }, [])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, aura_points, avatar_url, bio, phone_hash, is_banned, created_at, updated_at')
      .ilike('handle', `%${q}%`)
      .neq('id', currentUserId ?? '')
      .limit(15)
    setResults((data ?? []) as Profile[])
    setLoading(false)
  }, [currentUserId])

  async function handleFollow(userId: string) {
    if (!currentUserId) { router.push('/auth/login'); return }
    const supabase = createClient()
    await supabase.from('follows').upsert({ follower_id: currentUserId, following_id: userId })
  }

  const displayList = query.length >= 2 ? results : trending

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 58 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>

          {/* Search input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              id="search-page-input"
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search roasters by handle..."
              autoFocus
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            {loading && (
              <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {/* Section label */}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 14 }}>
          {query.length >= 2 ? `Results for "${query}"` : '🏆 Top Roasters by Aura'}
        </div>

        <AnimatePresence mode="popLayout">
          {trendingLoading && query.length < 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card" style={{ padding: '14px 16px', height: 72, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse-glow 1.5s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '35%', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8, animation: 'pulse-glow 1.5s infinite' }} />
                    <div style={{ height: 11, width: '25%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse-glow 1.5s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {query.length >= 2 ? `No one found with "${query}"` : 'No roasters yet. Be the first!'}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayList.map((user, idx) => (
                <div key={user.id} style={{ position: 'relative' }}>
                  {/* Rank badge for trending */}
                  {query.length < 2 && idx < 3 && (
                    <div style={{
                      position: 'absolute', top: -8, left: -4, zIndex: 2,
                      width: 22, height: 22, borderRadius: '50%',
                      background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#000',
                    }}>
                      {idx + 1}
                    </div>
                  )}
                  <UserRow
                    user={user}
                    onRoast={() => router.push(`/roast/new?targetHandle=${user.handle}`)}
                    onFollow={() => handleFollow(user.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
