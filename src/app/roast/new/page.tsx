'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Search, X, Loader2, ChevronLeft, Image, Zap } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createRoast, searchByHandle, getCurrentProfile } from '@/lib/api'
import { handleToColor, formatAura } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const MAX_CHARS = 280

function TargetBadge({ profile, onRemove }: { profile: Profile; onRemove: () => void }) {
  const color = handleToColor(profile.handle)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 'var(--radius-full)',
        background: `${color}15`, border: `1px solid ${color}40`,
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: `${color}25`, border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color,
      }}>
        {profile.handle[0].toUpperCase()}
      </div>
      <div>
        <span style={{ fontWeight: 700, fontSize: 13, color }}>@{profile.handle}</span>
        <span className="aura-badge" style={{ marginLeft: 6, fontSize: 10, padding: '1px 7px', color, borderColor: `${color}40`, background: `${color}12` }}>
          <Zap size={8} /> {formatAura(profile.aura_points)}
        </span>
      </div>
      <button onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color, display: 'flex', padding: 2 }}>
        <X size={14} />
      </button>
    </motion.div>
  )
}

function NewRoastForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const comebackRoastId = searchParams.get('comeback')

  const [target, setTarget] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authorProfile, setAuthorProfile] = useState<Profile | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  // Load author profile on mount
  useEffect(() => {
    getCurrentProfile().then((p) => {
      setAuthorProfile(p)
    }).catch(() => {})
  }, [])

  const charsLeft = MAX_CHARS - content.length
  const isOverLimit = charsLeft < 0
  const canSubmit = target && content.trim().length >= 5 && !isOverLimit && !submitting

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const results = await searchByHandle(q)
      // Filter out yourself
      setSearchResults(results.filter((r) => r.id !== authorProfile?.id))
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }, [authorProfile?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !target) return
    setError('')
    setSubmitting(true)
    try {
      const { remaining: rem } = await createRoast(
        authorProfile?.id ?? '',
        target.id,
        content.trim(),
        comebackRoastId ?? undefined,
      )
      setRemaining(rem)
      router.push('/feed')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post roast')
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', padding: '0 0 80px' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--aura-orange)', top: '-10%', right: '-5%', opacity: 0.12 }} />
        <div className="glow-orb" style={{ width: 350, height: 350, background: 'var(--aura-pink)', bottom: '10%', left: '-5%', opacity: 0.1, animationDelay: '4s' }} />
      </div>

      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16, height: 58 }}>
          <button onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Flame size={18} style={{ color: 'var(--aura-pink)' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              {comebackRoastId ? '🔥 Fire Back!' : 'Drop a Roast'}
            </span>
          </div>
          {comebackRoastId && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--aura-pink)', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
              ⏱ Comeback mode
            </span>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px', position: 'relative', zIndex: 1 }}>
        <form onSubmit={handleSubmit}>

          {/* Target Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              🎯 Who are you roasting?
            </label>

            <AnimatePresence mode="wait">
              {target ? (
                <TargetBadge key="badge" profile={target} onRemove={() => setTarget(null)} />
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    id="target-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by handle..."
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '12px 12px 12px 38px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />

                  {/* Search results dropdown */}
                  <AnimatePresence>
                    {(searching || searchResults.length > 0) && searchQuery.length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 100,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                      >
                        {searching && (
                          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Searching...
                          </div>
                        )}
                        {!searching && searchResults.length === 0 && (
                          <div style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>No users found</div>
                        )}
                        {searchResults.map((result) => {
                          const c = handleToColor(result.handle)
                          return (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => { setTarget(result); setSearchQuery(''); setSearchResults([]) }}
                              style={{
                                width: '100%', padding: '10px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10,
                                textAlign: 'left', transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: `${c}25`, border: `1.5px solid ${c}50`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, color: c,
                              }}>
                                {result.handle[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: c }}>@{result.handle}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {formatAura(result.aura_points)} aura
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Roast content */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              🔥 Your roast
            </label>
            <div style={{
              background: 'var(--bg-elevated)', border: `1px solid ${isOverLimit ? 'rgba(255,60,172,0.5)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <textarea
                id="roast-content-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Say something brutal... be creative, not just mean."
                rows={5}
                style={{
                  width: '100%', padding: '16px', background: 'transparent',
                  border: 'none', outline: 'none', resize: 'none',
                  color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.65,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
                onFocus={(e) => {
                  const parent = e.target.parentElement
                  if (parent) parent.style.borderColor = 'var(--aura-pink)'
                }}
                onBlur={(e) => {
                  const parent = e.target.parentElement
                  if (parent) parent.style.borderColor = isOverLimit ? 'rgba(255,60,172,0.5)' : 'var(--border-subtle)'
                }}
              />
              {/* Char counter */}
              <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <button type="button" title="Add image (coming soon)"
                  style={{ background: 'none', border: 'none', cursor: 'not-allowed', color: 'var(--text-secondary)', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <Image size={14} /> Media (coming soon)
                </button>
                <span style={{
                  fontSize: 12, fontFamily: 'Space Mono, monospace', fontWeight: 700,
                  color: isOverLimit ? 'var(--aura-pink)' : charsLeft <= 50 ? 'var(--aura-yellow)' : 'var(--text-secondary)',
                }}>
                  {charsLeft}
                </span>
              </div>
            </div>
          </div>

          {/* Aura cost notice */}
          {target && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{
                padding: '12px 16px', marginBottom: 20,
                borderColor: 'rgba(255,210,0,0.25)',
                background: 'rgba(255,210,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
              }}
            >
              <Zap size={15} style={{ color: 'var(--aura-yellow)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                When people like this roast, they spend <strong style={{ color: 'var(--aura-yellow)' }}>10 Aura</strong> each.
                You earn it. <strong style={{ color: 'var(--aura-pink)' }}>@{target.handle}</strong> loses it.
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: 'var(--aura-pink)', fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            id="submit-roast-btn"
            type="submit"
            disabled={!canSubmit}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px', opacity: canSubmit ? 1 : 0.45 }}
          >
            {submitting ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Posting...</>
            ) : (
              <><Flame size={18} /> Drop the Roast 🔥</>
            )}
          </button>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
            Keep it witty. AI moderation coming in M8.
          </p>
        </form>
      </div>
    </main>
  )
}

export default function NewRoastPage() {
  return (
    <Suspense>
      <NewRoastForm />
    </Suspense>
  )
}
