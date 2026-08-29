'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, MessageSquareOff, Send, Flame, Zap, Heart } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, RoastWithProfiles, CommentWithAuthor } from '@/lib/types'
import RoastCard from '@/components/RoastCard'
import { getCurrentProfile } from '@/lib/api'
import { handleToColor, timeAgo, formatAura } from '@/lib/utils'
import { RoastText } from '@/components/RoastText'

/** Single comment row */
function CommentRow({ comment, currentUser }: { comment: CommentWithAuthor, currentUser: Profile | null }) {
  const author = comment.author
  const color = handleToColor(author.handle)
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <a href={`/u/${author.handle}`} style={{ flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${color}25`, border: `1.5px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color,
        }}>
          {author.handle[0].toUpperCase()}
        </div>
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <a href={`/u/${author.handle}`} style={{ fontWeight: 700, fontSize: 13, color, textDecoration: 'none' }}>
            @{author.handle}
          </a>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 'var(--radius-full)', background: `${color}15`, border: `1px solid ${color}30`, color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Zap size={8} /> {formatAura(author.aura_points)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace', marginLeft: 'auto' }}>
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word', paddingBottom: 4 }}>
          <RoastText text={comment.content_text} />
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <button
            onClick={async () => {
              if (!currentUser) { window.location.href = '/auth/login'; return; }
              const supabase = createClient()
              // Optimistic toggle skipped for brevity, just a basic insert
              const { error } = await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: currentUser.id })
              if (error) {
                if (error.code === '23505') {
                  // already liked, unlike
                  await supabase.from('comment_likes').delete().match({ comment_id: comment.id, user_id: currentUser.id })
                }
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            <Heart size={14} />
            <span style={{ fontFamily: 'Space Grotesk' }}>{comment.likes_count}</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function CommentBox({ roastId, currentUser, onPosted }: {
  roastId: string
  currentUser: Profile | null
  onPosted: (c: CommentWithAuthor) => void
}) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const color = currentUser ? handleToColor(currentUser.handle) : 'var(--aura-pink)'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) { window.location.href = '/auth/login'; return }
    if (!text.trim()) return
    setPosting(true); setError('')
    try {
      const supabase = createClient()
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({ roast_id: roastId, author_id: currentUser.id, content_text: text.trim() })
        .select('id')
        .single()
      
      if (insertError) throw insertError

      // Get author details and notify target
      const { data } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(id,handle,aura_points,avatar_url)')
        .eq('id', newComment.id)
        .single()
        
      if (data) {
        onPosted(data as CommentWithAuthor)
        
        // Notify original roast author (fire and forget)
        const { data: roastData } = await supabase.from('roasts').select('author_id').eq('id', roastId).single()
        if (roastData && roastData.author_id !== currentUser.id) {
          supabase.from('notifications').insert({
            user_id: roastData.author_id,
            from_user_id: currentUser.id,
            type: 'commented',
            roast_id: roastId
          }).then()
        }
      }
      setText('')
      textareaRef.current?.focus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    }
    setPosting(false)
  }

  if (!currentUser) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Sign in to drop a comeback</p>
        <a href="/auth/login" className="btn-primary" style={{ fontSize: 13, padding: '8px 20px', display: 'inline-flex' }}>
          <Flame size={14} /> Sign In
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${color}25`, border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color,
      }}>
        {currentUser.handle[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color 0.2s',
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            onFocus={(e) => { e.currentTarget.parentElement!.style.borderColor = `${color}60` }}
            onBlur={(e) => { e.currentTarget.parentElement!.style.borderColor = 'var(--border-subtle)' }}
            placeholder="Fire back..."
            maxLength={280}
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6,
              padding: '12px 14px 4px', resize: 'none', fontFamily: 'Space Grotesk, sans-serif',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 10px' }}>
            <span style={{ fontSize: 11, color: text.length > 240 ? 'var(--aura-orange)' : 'var(--text-secondary)' }}>
              {text.length}/280
            </span>
            <button
              type="submit"
              disabled={posting || !text.trim()}
              style={{
                background: text.trim() ? color : 'transparent',
                border: `1px solid ${color}`,
                color: text.trim() ? 'white' : color,
                padding: '5px 14px', borderRadius: 'var(--radius-full)',
                fontSize: 12, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                opacity: posting ? 0.6 : 1, transition: 'all 0.2s',
              }}
            >
              {posting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={12} />}
              {posting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--aura-pink)', marginTop: 6 }}>⚠️ {error}</p>}
      </div>
    </form>
  )
}

export default function RoastDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roastId = params.id as string

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [roast, setRoast] = useState<RoastWithProfiles | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profile = await getCurrentProfile()
        setCurrentUser(profile)
        const supabase = createClient()
        const { data: mainRoast } = await supabase
          .from('roasts')
          .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
          .eq('id', roastId)
          .single()
        if (mainRoast) {
          setRoast(mainRoast as RoastWithProfiles)
          const { data: replies } = await supabase
            .from('comments')
            .select('*, author:profiles!comments_author_id_fkey(id,handle,aura_points,avatar_url)')
            .eq('roast_id', roastId)
            .order('created_at', { ascending: true })
          setComments(((replies ?? []) as CommentWithAuthor[]).filter(r => r.author !== null))
        }
      } catch (err) {
        console.error('Failed to load roast thread', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roastId])

  // Realtime subscription for new comments
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`roast-comments:${roastId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comments',
        filter: `roast_id=eq.${roastId}`,
      }, async (payload) => {
        const newRow = payload.new as { id: string }
        const { data } = await supabase
          .from('comments')
          .select('*, author:profiles!comments_author_id_fkey(id,handle,aura_points,avatar_url)')
          .eq('id', newRow.id)
          .single()
        if (data && (data as CommentWithAuthor).author !== null) {
          setComments(prev => {
            const exists = prev.some(c => c.id === (data as CommentWithAuthor).id)
            return exists ? prev : [...prev, data as CommentWithAuthor]
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'comments',
        filter: `roast_id=eq.${roastId}`,
      }, (payload) => {
        const updatedRow = payload.new as { id: string, likes_count: number }
        setComments(prev => prev.map(c => c.id === updatedRow.id ? { ...c, likes_count: updatedRow.likes_count } : c))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roastId])

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  if (!roast) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>👻</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Roast Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This roast was either deleted or never existed.</p>
        <button onClick={() => router.push('/feed')} className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: 14 }}>Back to Feed</button>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="glow-orb" style={{ width: 350, height: 350, background: 'var(--aura-pink)', top: '-10%', right: '-5%', opacity: 0.06 }} />
      </div>

      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 58, gap: 16 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Roast Thread</span>
          {comments.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
              {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px', position: 'relative', zIndex: 1 }}>
        <RoastCard roast={roast} currentUser={currentUser} />

        <div className="glass-card" style={{ padding: '18px 20px', marginTop: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            💬 Drop a Reply
          </h3>
          <CommentBox
            roastId={roastId}
            currentUser={currentUser}
            onPosted={(c) => setComments(prev => {
              const exists = prev.some(x => x.id === c.id)
              return exists ? prev : [...prev, c]
            })}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ padding: '0 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'Reply' : 'Replies'}` : 'Replies'}
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {comments.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.8 }}>
            <MessageSquareOff size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No replies yet. Be the first to fire back.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0 20px' }}>
            <AnimatePresence>
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} currentUser={currentUser} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
