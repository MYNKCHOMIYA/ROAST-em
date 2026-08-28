'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ArrowLeft, Loader2, CheckCheck, Flame, Zap, UserPlus, Swords } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/hooks/useNotifications'
import { handleToColor, timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const NOTIF_CONFIG: Record<Notification['type'], { icon: React.ReactNode; label: string; color: string }> = {
  roasted:  { icon: <Flame size={18} />,    label: 'Roasted you',        color: '#FF3CAC' },
  liked:    { icon: <Zap size={18} />,      label: 'Gave you Aura',      color: '#FFD200' },
  comeback: { icon: <Swords size={18} />,   label: 'Fired back at you',  color: '#56CCF2' },
  followed: { icon: <UserPlus size={18} />, label: 'Followed you',       color: '#A78BFA' },
}

function NotifCard({ notif }: { notif: Notification }) {
  const cfg = NOTIF_CONFIG[notif.type]
  const handle = notif.from_user?.handle ?? 'someone'
  const avatarColor = handleToColor(handle)

  return (
    <motion.a
      href={notif.roast_id ? `/roast/${notif.roast_id}` : `/u/${handle}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass-card"
      style={{
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        textDecoration: 'none',
        borderColor: notif.is_read ? 'var(--border-subtle)' : `${cfg.color}40`,
        background: notif.is_read ? undefined : `${cfg.color}06`,
        transition: 'all 0.2s',
      }}
    >
      {/* Avatar with type icon overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: `${avatarColor}20`, border: `2px solid ${avatarColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: avatarColor,
        }}>
          {handle[0].toUpperCase()}
        </div>
        <div style={{
          position: 'absolute', bottom: -3, right: -3,
          width: 22, height: 22, borderRadius: '50%',
          background: cfg.color, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-surface)',
        }}>
          {/* Scaled icon */}
          <span style={{ transform: 'scale(0.65)', display: 'flex' }}>{cfg.icon}</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: avatarColor }}>@{handle}</span>
          {' '}
          <span style={{ color: 'var(--text-primary)' }}>{cfg.label}</span>
          {notif.type === 'liked' && (
            <span style={{ color: 'var(--aura-yellow)', fontWeight: 700 }}> ⚡ +10 Aura</span>
          )}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', fontFamily: 'Space Mono, monospace' }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cfg.color, flexShrink: 0,
          boxShadow: `0 0 8px ${cfg.color}`,
        }} />
      )}
    </motion.a>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const { notifications, unreadCount, markAllRead } = useNotifications(userId)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      setLoadingUser(false)
    })
  }, [router])

  if (loadingUser) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  // Group: today vs earlier
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const today = notifications.filter((n) => new Date(n.created_at) >= todayStart)
  const earlier = notifications.filter((n) => new Date(n.created_at) < todayStart)

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--aura-purple)', top: '-10%', right: '-5%', opacity: 0.08 }} />
      </div>

      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()}
              style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: 'var(--aura-pink)' }} />
              <span style={{ fontWeight: 700, fontSize: 17 }}>Notifications</span>
              {unreadCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ background: 'var(--aura-pink)', color: 'white', borderRadius: 'var(--radius-full)', padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>
                  {unreadCount}
                </motion.div>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={markAllRead}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px', position: 'relative', zIndex: 1 }}>
        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card"
            style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Bell size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>All quiet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              No notifications yet. Drop a roast to get people talking.
            </p>
            <a href="/roast/new" className="btn-primary" style={{ marginTop: 20, fontSize: 14, display: 'inline-flex' }}>
              <Flame size={15} /> Drop a Roast
            </a>
          </motion.div>
        ) : (
          <>
            {today.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Today
                </div>
                <AnimatePresence>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {today.map((n) => <NotifCard key={n.id} notif={n} />)}
                  </div>
                </AnimatePresence>
              </div>
            )}

            {earlier.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Earlier
                </div>
                <AnimatePresence>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {earlier.map((n) => <NotifCard key={n.id} notif={n} />)}
                  </div>
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
