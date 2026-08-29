'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronRight, Zap, Clock, MessageCircle, Share2, Flag, MoreHorizontal } from 'lucide-react'
import type { RoastWithProfiles, Profile } from '@/lib/types'
import { likeRoast, reportRoast } from '@/lib/api'
import { formatAura, handleToColor, timeAgo, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { RoastText } from './RoastText'

function CooldownTimer({ endsAt, onComplete }: { endsAt: number, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endsAt - Date.now()))

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        clearInterval(timer)
        onComplete()
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [endsAt, onComplete])

  const mins = Math.floor(timeLeft / 60000)
  const secs = Math.floor((timeLeft % 60000) / 1000)
  return <span>{mins}:{secs.toString().padStart(2, '0')}</span>
}

interface RoastCardProps {
  roast: RoastWithProfiles
  currentUser: Profile | null
  index?: number
  initialIsFollowing?: boolean
  onLiked?: (roastId: string) => void
  onUnfollow?: (authorId: string) => void
}

/** Countdown timer for the 2-minute comeback window */
function ComebackTimer({ endsAt }: { endsAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    function update() {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  if (secondsLeft <= 0) return null

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const urgent = secondsLeft <= 30

  return (
    <motion.div
      animate={{ opacity: urgent ? [1, 0.4, 1] : 1 }}
      transition={{ repeat: urgent ? Infinity : 0, duration: 0.8 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 'var(--radius-full)',
        background: urgent ? 'rgba(255,60,172,0.2)' : 'rgba(0,212,255,0.1)',
        border: `1px solid ${urgent ? 'rgba(255,60,172,0.4)' : 'rgba(0,212,255,0.25)'}`,
        fontSize: 11, fontFamily: 'Space Mono, monospace', fontWeight: 700,
        color: urgent ? 'var(--aura-pink)' : 'var(--aura-cyan)',
      }}
    >
      <Clock size={10} />
      {mins}:{secs.toString().padStart(2, '0')} comeback
    </motion.div>
  )
}

/** Avatar circle — shows real photo if available, else colored initials */
function Avatar({ handle, avatarUrl, size = 36 }: { handle: string; avatarUrl?: string | null; size?: number }) {
  const color = handleToColor(handle)
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`@${handle}`}
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          objectFit: 'cover', border: `1.5px solid ${color}50`,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}25`, border: `1.5px solid ${color}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color,
    }}>
      {handle[0].toUpperCase()}
    </div>
  )
}

export default function RoastCard({ roast, index = 0, currentUser, onLiked, onUnfollow, initialIsFollowing = false }: RoastCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeError, setLikeError] = useState('')
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null)
  const [localLikeCount, setLocalLikeCount] = useState(roast.aura_gained)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followLoading, setFollowLoading] = useState(false)
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [isReported, setIsReported] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  const author = roast.author?.is_deleted
    ? { id: '', handle: 'deleted', aura_points: 0, avatar_url: null, is_deleted: true }
    : roast.author ?? { id: '', handle: 'deleted', aura_points: 0, avatar_url: null, is_deleted: true }
  const target = roast.target?.is_deleted
    ? { id: '', handle: 'deleted', aura_points: 0, avatar_url: null, is_deleted: true }
    : roast.target ?? { id: '', handle: 'deleted', aura_points: 0, avatar_url: null, is_deleted: true }

  const authorColor = handleToColor(author.handle)
  const isOwnRoast = currentUser?.id === roast.author_id
  const isTarget = currentUser?.id === roast.target_id
  const comebackActive = roast.comeback_window_ends_at && new Date(roast.comeback_window_ends_at) > new Date()

  async function handleLike() {
    if (!currentUser) { setLikeError('Log in to give Aura'); return }
    if (liked) return
    if (isOwnRoast) { setLikeError("Can't like your own roast"); return }
    if ((currentUser.aura_points ?? 0) < 10) { setLikeError('Not enough Aura (need 10)'); return }

    setLikeLoading(true)
    setLikeError('')
    try {
      await likeRoast(roast.id, currentUser.id, roast.author_id, roast.target_id, 10)
      setLiked(true)
      setLocalLikeCount((p) => p + 10)
      setCooldownEndsAt(Date.now() + 5 * 60 * 1000)
      onLiked?.(roast.id)
    } catch (e: unknown) {
      setLikeError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLikeLoading(false)
    }
  }

  async function handleFollowToggle() {
    if (!currentUser) {
      window.location.href = '/auth/login'
      return
    }
    if (followLoading) return

    if (isFollowing) {
      // Show confirmation modal for unfollowing
      setShowUnfollowConfirm(true)
      return
    }

    // Instantly follow
    setFollowLoading(true)
    setIsFollowing(true)
    try {
      const supabase = createClient()
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: author.id })
    } catch (e) {
      console.error(e)
      setIsFollowing(false)
    }
    setFollowLoading(false)
  }

  async function confirmUnfollow() {
    setShowUnfollowConfirm(false)
    setFollowLoading(true)
    setIsFollowing(false)
    try {
      const supabase = createClient()
      await supabase.from('follows').delete().eq('follower_id', currentUser!.id).eq('following_id', author.id)
      onUnfollow?.(author.id)
    } catch (e) {
      console.error(e)
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/roast/${roast.id}`)
      setShowShare(true)
      setTimeout(() => setShowShare(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleReport(reason: string) {
    if (!currentUser) return
    setReportLoading(true)
    try {
      await reportRoast(roast.id, reason)
      setIsReported(true)
    } catch (e) {
      console.error('Failed to report roast', e)
    }
    setReportLoading(false)
    setShowReportMenu(false)
  }

  if (isReported) return null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card"
      style={{
        padding: '18px 20px',
        borderColor: liked ? `${authorColor}40` : 'var(--border-subtle)',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1, opacity: liked ? 0.8 : 0.4,
        background: `linear-gradient(90deg, transparent, ${authorColor}, transparent)`,
        transition: 'opacity 0.3s',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href={`/u/${author.handle}`}>
            <Avatar handle={author.handle} avatarUrl={author.avatar_url} />
          </a>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: authorColor }}>
                <a href={`/u/${author.handle}`} style={{ color: 'inherit', textDecoration: 'none' }}>@{author.handle}</a>
              </span>
              {currentUser && !isOwnRoast && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.preventDefault(); handleFollowToggle(); }}
                    disabled={followLoading}
                    style={{
                      background: isFollowing ? 'rgba(255,255,255,0.05)' : 'var(--aura-cyan)',
                      color: isFollowing ? 'var(--text-secondary)' : '#000',
                      border: isFollowing ? '1px solid var(--border-subtle)' : 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <AnimatePresence>
                    {showUnfollowConfirm && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, marginTop: 8,
                          background: 'var(--bg-elevated)', border: `1px solid ${authorColor}50`,
                          borderRadius: 'var(--radius-md)', padding: 12, zIndex: 100,
                          minWidth: 160, boxShadow: `0 8px 32px ${authorColor}30`,
                          backdropFilter: 'blur(12px)'
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, textAlign: 'center', color: 'var(--text-primary)' }}>
                          Unfollow @{author.handle}?
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={(e) => { e.preventDefault(); setShowUnfollowConfirm(false); }}
                            style={{ flex: 1, padding: '6px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); confirmUnfollow(); }}
                            style={{ flex: 1, padding: '6px', fontSize: 11, background: `${authorColor}20`, border: `1px solid ${authorColor}50`, borderRadius: 'var(--radius-sm)', color: authorColor, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Unfollow
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <span className="aura-badge" style={{ fontSize: 10, padding: '2px 8px', color: authorColor, borderColor: `${authorColor}40`, background: `${authorColor}12` }}>
                <Zap size={9} /> {formatAura(author.aura_points)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0 0 0' }}>
              <ChevronRight size={11} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>roasting</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <a href={`/u/${target.handle}`} style={{ color: 'inherit', textDecoration: 'none' }}>@{target.handle}</a>
              </span>
              <span className="aura-badge" style={{ fontSize: 10, padding: '2px 8px' }}>
                <Zap size={9} /> {formatAura(target.aura_points)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`/roast/${roast.id}`} style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace', textDecoration: 'none' }}>
              {timeAgo(roast.created_at)}
            </a>
            
            {/* Report Menu */}
            {!isOwnRoast && currentUser && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 2 }}
                >
                  <MoreHorizontal size={14} />
                </button>
                {showReportMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', padding: 4, zIndex: 10,
                    width: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    {['Spam', 'Harassment', 'Hate Speech'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => handleReport(reason)}
                        disabled={reportLoading}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                          background: 'none', border: 'none', color: 'var(--aura-pink)',
                          fontSize: 12, cursor: 'pointer', borderRadius: 'var(--radius-sm)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,60,172,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Flag size={10} style={{ display: 'inline-block', marginRight: 6 }} />
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {comebackActive && <ComebackTimer endsAt={roast.comeback_window_ends_at!} />}
        </div>
      </div>

      {/* Content */}
      {roast.content_text && (
        <p style={{
          fontSize: 15, lineHeight: 1.65, marginBottom: 14,
          color: 'var(--text-primary)', letterSpacing: '-0.01em',
        }}>
          <RoastText text={roast.content_text} />
        </p>
      )}

      {/* Media */}
      {roast.media_url && roast.media_type === 'image' && (
        <div style={{ marginBottom: 14, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={roast.media_url} alt="Roast media" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Like / Aura button */}
        <motion.button
          id={`like-roast-${roast.id}`}
          onClick={handleLike}
          disabled={likeLoading || liked || isOwnRoast}
          whileHover={!liked && !isOwnRoast ? { scale: 1.08 } : {}}
          whileTap={!liked && !isOwnRoast ? { scale: 0.93 } : {}}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: liked
              ? `linear-gradient(135deg, ${authorColor}25, ${authorColor}10)`
              : 'transparent',
            border: `1px solid ${liked ? `${authorColor}50` : 'var(--border-subtle)'}`,
            cursor: liked || isOwnRoast ? 'default' : 'pointer',
            transition: 'all 0.2s',
            opacity: likeLoading ? 0.6 : 1,
          }}
        >
          <motion.div
            animate={liked ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Flame size={15} style={{ color: liked ? authorColor : 'var(--text-secondary)' }} />
          </motion.div>
          <span style={{
            fontSize: 13, fontFamily: 'Space Mono, monospace', fontWeight: 700,
            color: liked ? authorColor : 'var(--text-secondary)',
          }}>
            {liked && cooldownEndsAt ? (
              <CooldownTimer endsAt={cooldownEndsAt} onComplete={() => { setLiked(false); setCooldownEndsAt(null); }} />
            ) : (
              formatAura(localLikeCount)
            )}
          </span>
          {!liked && !isOwnRoast && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>aura</span>
          )}
        </motion.button>

        {/* Comeback button or Thread link */}
        {roast.has_fireback ? (
          <a
            href={`/roast/${roast.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,60,172,0.15)', border: '1px solid rgba(255,60,172,0.4)',
              color: 'var(--aura-pink)', fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Flame size={13} />
            View Thread
          </a>
        ) : isTarget && comebackActive ? (
          <motion.a
            href={`/roast/new?comeback=${roast.id}&targetHandle=${author.handle}`}
            animate={{ boxShadow: ['0 0 0px rgba(255,60,172,0)', '0 0 20px rgba(255,60,172,0.4)', '0 0 0px rgba(255,60,172,0)'] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--aura-pink), var(--aura-purple))',
              color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Flame size={13} />
            Fire Back!
          </motion.a>
        ) : null}

        {/* Comment System */}
        <a
          href={`/roast/${roast.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}
        >
          <MessageCircle size={14} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 600 }}>Reply</span>
        </a>

        <button
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginLeft: 'auto' }}
        >
          <Share2 size={14} />
        </button>
      </div>

      {/* Inline error */}
      <AnimatePresence>
        {likeError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 12, color: 'var(--aura-pink)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}
          >
            ⚠️ {likeError}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
