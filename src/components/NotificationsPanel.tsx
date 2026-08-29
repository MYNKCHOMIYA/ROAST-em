'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Flame, Zap, UserPlus, Swords, X, CheckCheck } from 'lucide-react'
import { handleToColor, timeAgo } from '@/lib/utils'
import type { Notification } from '@/lib/types'

export const NOTIF_ICONS: Record<Notification['type'], React.ReactNode> = {
  roasted:   <Flame size={14} style={{ color: '#FF3CAC' }} />,
  liked:     <Zap size={14} style={{ color: '#FFD200' }} />,
  comeback:  <Swords size={14} style={{ color: '#56CCF2' }} />,
  followed:  <UserPlus size={14} style={{ color: '#A78BFA' }} />,
  milestone: <Zap size={14} style={{ color: '#FFD200' }} />,
}

export const NOTIF_TEXT: Record<Notification['type'], (handle: string) => string> = {
  roasted:   (h) => `@${h} roasted you 🔥`,
  liked:     (h) => `@${h} gave you Aura ⚡`,
  comeback:  (h) => `@${h} fired back at you ⚔️`,
  followed:  (h) => `@${h} is following you`,
  milestone: (_h) => `Aura milestone reached 🎉 Keep it up!`,
}

interface NotificationsPanelProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
  onClose: () => void
}

function NotifRow({ notif }: { notif: Notification }) {
  const handle = notif.from_user?.handle ?? 'someone'
  const color = handleToColor(handle)

  return (
    <motion.a
      href={notif.roast_id ? `/roast/${notif.roast_id}` : `/u/${handle}`}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', textDecoration: 'none',
        background: notif.is_read ? 'transparent' : 'rgba(255,60,172,0.05)',
        borderLeft: `2px solid ${notif.is_read ? 'transparent' : 'var(--aura-pink)'}`,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-glass)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(255,60,172,0.05)' }}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${color}20`, border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color, position: 'relative',
      }}>
        {handle[0].toUpperCase()}
        {/* Icon badge */}
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {NOTIF_ICONS[notif.type]}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--text-primary)', margin: 0 }}>
          {NOTIF_TEXT[notif.type](handle)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0', fontFamily: 'Space Mono, monospace' }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--aura-pink)', flexShrink: 0 }} />
      )}
    </motion.a>
  )
}

export function NotificationsPanel({ notifications, unreadCount, onMarkAllRead, onClose }: NotificationsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'absolute', right: 0, top: 48, width: 360,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        zIndex: 200,
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} style={{ color: 'var(--aura-pink)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
          {unreadCount > 0 && (
            <div style={{ background: 'var(--aura-pink)', color: 'white', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
              {unreadCount}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead}
              title="Mark all as read"
              style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '5px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Bell size={28} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No notifications yet</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>When someone roasts or likes you, it'll appear here</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notif) => (
              <NotifRow key={notif.id} notif={notif} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <a href="/notifications" style={{ fontSize: 12, color: 'var(--aura-pink)', textDecoration: 'none', fontWeight: 600 }}>
          View all notifications →
        </a>
      </div>
    </motion.div>
  )
}

/** Bell icon button with red dot for unread count */
export function NotificationsBell({ unreadCount, onClick }: { unreadCount: number; onClick: () => void }) {
  return (
    <button
      id="notif-bell-btn"
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: 'transparent', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative',
      }}
    >
      <Bell size={16} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            key="dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              position: 'absolute', top: 6, right: 6,
              minWidth: 16, height: 16, borderRadius: 'var(--radius-full)',
              background: 'var(--aura-pink)', border: '1.5px solid var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: 'white',
              padding: unreadCount > 9 ? '0 3px' : 0,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
