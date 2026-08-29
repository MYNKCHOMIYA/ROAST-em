'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, Search, PenLine, User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Notification } from '@/lib/types'
import { formatAura, handleToColor } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { useClickOutside } from '@/hooks/useClickOutside'
import { NotificationsBell, NotificationsPanel, NOTIF_ICONS, NOTIF_TEXT } from '@/components/NotificationsPanel'

interface FeedNavProps {
  profile: Profile | null
  activeTab: 'global' | 'following'
  onTabChange: (tab: 'global' | 'following') => void
}

export default function FeedNav({ profile, activeTab, onTabChange }: FeedNavProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [toastNotif, setToastNotif] = useState<Notification | null>(null)
  const [liveAura, setLiveAura] = useState(profile?.aura_points ?? 0)
  const [showNav, setShowNav] = useState(true)
  const lastScrollY = useRef(0)
  const { notifications, unreadCount, latestNotification, markAllRead } = useNotifications(profile?.id ?? null)

  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useClickOutside(menuRef, () => setShowMenu(false))
  useClickOutside(notifRef, () => setShowNotifs(false))

  const avatarColor = profile ? handleToColor(profile.handle) : 'var(--aura-pink)'

  useEffect(() => {
    if (profile) setLiveAura(profile.aura_points)
  }, [profile])

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()
    const channel = supabase.channel(`profile-aura:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          if (payload.new && typeof payload.new.aura_points === 'number') {
            setLiveAura(payload.new.aura_points)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowNav(false)
      } else {
        setShowNav(true)
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Toast for new notifications
  useEffect(() => {
    if (latestNotification) {
      setToastNotif(latestNotification)
      const timer = setTimeout(() => setToastNotif(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [latestNotification])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <nav
        className="glass"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: showNav ? 'translateY(0)' : 'translateY(-100%)'
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Flame size={20} style={{ color: 'var(--aura-pink)' }} />
              <span className="gradient-text-pink" style={{ fontSize: 18, fontWeight: 700 }}>ROAST&apos;em</span>
            </a>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Aura badge */}
              {profile && (
                <div className="aura-badge" style={{ fontSize: 12 }}>
                  <Zap size={11} style={{ color: 'var(--aura-yellow)' }} />
                  <span style={{ color: 'var(--aura-yellow)' }}>{formatAura(liveAura)}</span>
                  <span className="hidden sm:inline" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>aura</span>
                </div>
              )}

              {/* Search */}
              <button
                id="feed-search-btn"
                aria-label="Search"
                style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                onClick={() => router.push('/search')}
              >
                <Search size={16} />
              </button>

              {/* Notifications */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <NotificationsBell
                  unreadCount={unreadCount}
                  onClick={() => {
                    setShowNotifs((v) => !v)
                    if (!showNotifs && unreadCount > 0) {
                      markAllRead()
                    }
                  }}
                />
                <AnimatePresence>
                  {showNotifs && (
                    <NotificationsPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkAllRead={async () => { await markAllRead(); }}
                      onClose={() => setShowNotifs(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Post roast CTA */}
              <div className="hidden sm:flex">
                <a
                  id="post-roast-btn"
                  href="/roast/new"
                  className="btn-primary"
                  style={{ padding: '7px 14px', fontSize: 13, gap: 6 }}
                >
                  <PenLine size={14} />
                  Roast
                </a>
              </div>

              {/* Avatar / profile dropdown */}
              {profile && (
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button
                    id="profile-avatar-btn"
                    onClick={() => setShowMenu((v) => !v)}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                      background: `${avatarColor}25`, border: `1.5px solid ${avatarColor}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: avatarColor, fontWeight: 700, fontSize: 14,
                      padding: 0,
                    }}
                  >
                    {profile.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={profile.avatar_url} alt={profile.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile.handle[0].toUpperCase()
                    }
                  </button>

                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      style={{
                        position: 'absolute', right: 0, top: 44,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        minWidth: 180, padding: '6px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>@{profile.handle}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatAura(profile.aura_points)} aura</div>
                      </div>
                      <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <User size={14} /> My Profile
                      </a>
                      <a href="/profile/edit" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        ✏️ Edit Profile
                      </a>
                      <a href="/rules" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        📖 Rulebook
                      </a>
                      <a href="/leaderboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        🏆 Leaderboard
                      </a>
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--aura-pink)', fontSize: 13, textAlign: 'left' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,60,172,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={14} /> {loggingOut ? 'Leaving...' : 'Log Out'}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border-subtle)' }}>
            {(['global', 'following'] as const).map((tab) => (
              <button
                key={tab}
                id={`feed-tab-${tab}`}
                onClick={() => onTabChange(tab)}
                style={{
                  flex: 1, padding: '10px 0', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--aura-pink)' : 'transparent'}`,
                  transition: 'all 0.2s',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                {tab === 'global' ? '🔥 Global' : '👥 Following'}
              </button>
            ))}
          </div>
        </div>

      {/* Global Toast Popup */}
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              background: 'var(--bg-elevated)', border: '1px solid var(--aura-pink)',
              borderRadius: 'var(--radius-lg)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 8px 32px rgba(255,60,172,0.2)',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,60,172,0.1)', border: '1px solid rgba(255,60,172,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {NOTIF_ICONS[toastNotif.type]}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {NOTIF_TEXT[toastNotif.type](toastNotif.from_user?.handle ?? 'someone')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  )
}
