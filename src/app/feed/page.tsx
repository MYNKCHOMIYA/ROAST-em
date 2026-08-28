'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Loader2, RefreshCw, Zap, ArrowUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FeedNav from '@/components/FeedNav'
import RoastCard from '@/components/RoastCard'
import { fetchGlobalFeed, fetchFollowingFeed, getCurrentProfile, getMyFollowingIds } from '@/lib/api'
import type { RoastWithProfiles, Profile } from '@/lib/types'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function WelcomeBanner() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(searchParams.get('welcome') === '1')
  useEffect(() => {
    if (show) setTimeout(() => setShow(false), 6000)
  }, [show])
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="glass-card"
      style={{
        marginBottom: 20, padding: '14px 18px',
        borderColor: 'rgba(255,60,172,0.35)',
        background: 'linear-gradient(135deg, rgba(255,60,172,0.08), rgba(120,75,160,0.08))',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{ fontSize: 32 }}>🔥</span>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Welcome to the arena!</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          You have <span style={{ color: 'var(--aura-yellow)', fontWeight: 700 }}>200 Aura</span> to start.
          Like roasts to spend it. Post roasts to earn it.
        </p>
      </div>
      <button onClick={() => setShow(false)}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}>
        ×
      </button>
    </motion.div>
  )
}

function EmptyFeed({ tab }: { tab: 'global' | 'following' }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>
        {tab === 'following' ? '👥' : '🔥'}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        {tab === 'following' ? 'No roasts from your crew yet' : 'The arena is quiet...'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
        {tab === 'following'
          ? 'Follow some roasters and their posts will appear here.'
          : 'Be the first to break the silence. Drop a roast.'}
      </p>
      <a href="/roast/new" className="btn-primary" style={{ fontSize: 14 }}>
        <Flame size={16} /> Drop a Roast
      </a>
    </motion.div>
  )
}

function NotConfiguredBanner() {
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 20,
      background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.35)',
      fontSize: 13, color: 'var(--aura-orange)', lineHeight: 1.6,
    }}>
      ⚠️ <strong>Dev Mode:</strong> Supabase not configured. Add your keys to <code style={{ fontFamily: 'Space Mono, monospace' }}>.env.local</code> and restart the dev server to see real data.
    </div>
  )
}

export default function FeedPage() {
  const [tab, setTab] = useState<'global' | 'following'>('global')
  const [roasts, setRoasts] = useState<RoastWithProfiles[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const [newRoastCount, setNewRoastCount] = useState(0)
  const realtimeChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const configured = isSupabaseConfigured()

  // Load current user profile
  useEffect(() => {
    if (!configured) return
    getCurrentProfile().then(p => {
      setProfile(p)
      if (p) {
        getMyFollowingIds(p.id).then(ids => setFollowingIds(new Set(ids)))
      }
    }).catch(() => {})
  }, [configured])

  const loadFeed = useCallback(async (currentTab: typeof tab, currentPage: number, replace = false) => {
    if (!configured) { setLoading(false); return }
    try {
      const data = currentTab === 'global'
        ? await fetchGlobalFeed(currentPage, 20)
        : await fetchFollowingFeed(profile?.id ?? '', currentPage, 20)
      setRoasts((prev) => replace ? data : [...prev, ...data])
      setHasMore(data.length === 20)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load feed')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [configured, profile?.id])

  // Load on mount and tab change
  useEffect(() => {
    setLoading(true)
    setRoasts([])
    setPage(0)
    setError('')
    setNewRoastCount(0)
    loadFeed(tab, 0, true)
  }, [tab, loadFeed])

  // Realtime: listen for new roasts — show "X new roasts" pill
  useEffect(() => {
    if (!configured) return
    const supabase = createClient()
    // Chain .on() BEFORE .subscribe() — no dynamic imports
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'roasts' }, () => {
        setNewRoastCount((c) => c + 1)
      })
      .subscribe()
    realtimeChannelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [configured])

  async function handleRefresh() {
    setRefreshing(true)
    setPage(0)
    await loadFeed(tab, 0, true)
  }

  async function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await loadFeed(tab, nextPage, false)
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="glow-orb" style={{ width: 500, height: 500, background: 'var(--aura-pink)', top: '-15%', right: '-10%', opacity: 0.08 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--aura-purple)', bottom: '10%', left: '-5%', opacity: 0.08, animationDelay: '5s' }} />
      </div>

      <FeedNav profile={profile} activeTab={tab} onTabChange={(t) => setTab(t)} />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px', position: 'relative', zIndex: 1 }}>

        <Suspense>
          <WelcomeBanner />
        </Suspense>

        {/* Realtime: new roasts pill */}
        <AnimatePresence>
          {newRoastCount > 0 && !loading && (
            <motion.button
              key="new-roasts-pill"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              onClick={() => { handleRefresh(); setNewRoastCount(0) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                margin: '0 auto 16px',
                padding: '8px 18px', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--aura-pink), var(--aura-purple))',
                border: 'none', cursor: 'pointer', color: 'white',
                fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 24px rgba(255,60,172,0.45)',
              }}
            >
              <ArrowUp size={14} />
              {newRoastCount} new roast{newRoastCount > 1 ? 's' : ''} — tap to load
            </motion.button>
          )}
        </AnimatePresence>

        {!configured && <NotConfiguredBanner />}

        {/* Refresh + post header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {tab === 'global' ? '🔥 Trending Roasts' : '👥 Your Crew'}
          </div>
          <button
            id="refresh-feed-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)', padding: '5px 12px',
              cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12,
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card" style={{ padding: '18px 20px', height: 160 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse-glow 1.5s ease infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '40%', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8, animation: 'pulse-glow 1.5s ease infinite' }} />
                    <div style={{ height: 11, width: '55%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse-glow 1.5s ease infinite' }} />
                  </div>
                </div>
                <div style={{ height: 13, width: '90%', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8, animation: 'pulse-glow 1.5s ease infinite' }} />
                <div style={{ height: 13, width: '70%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse-glow 1.5s ease infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderColor: 'rgba(255,60,172,0.3)' }}>
            <p style={{ color: 'var(--aura-pink)', fontSize: 14 }}>⚠️ {error}</p>
            <button onClick={handleRefresh} className="btn-ghost" style={{ marginTop: 12, fontSize: 13, padding: '8px 20px' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Feed */}
        {!loading && !error && (
          <>
            {roasts.length === 0 ? (
              <EmptyFeed tab={tab} />
            ) : (
              <AnimatePresence mode="popLayout">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {roasts.map((roast, i) => (
                    <RoastCard
                      key={`${roast.id}-${tab}`}
                      roast={roast}
                      index={i}
                      currentUser={profile}
                      initialIsFollowing={profile ? followingIds.has(roast.author_id) : false}
                      onLiked={() => {}}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Load more */}
            {hasMore && roasts.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  id="load-more-btn"
                  onClick={handleLoadMore}
                  className="btn-ghost"
                  style={{ fontSize: 14 }}
                >
                  Load more roasts
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating "New Roast" FAB */}
      <motion.a
        id="fab-new-roast"
        href="/roast/new"
        className="btn-primary"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          borderRadius: 'var(--radius-full)', padding: '14px 20px',
          fontSize: 14, zIndex: 50,
        }}
        whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(255,60,172,0.6)' }}
        whileTap={{ scale: 0.95 }}
      >
        <Flame size={18} />
        Roast
      </motion.a>
    </main>
  )
}
