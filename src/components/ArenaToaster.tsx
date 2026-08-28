'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Toast = {
  id: string
  handle: string
}

export default function ArenaToaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('arena-global')

    channel
      .on(
        'broadcast',
        { event: 'new_user' },
        (payload) => {
          const newToast: Toast = {
            id: Math.random().toString(36).substring(7),
            handle: payload.payload.handle,
          }
          setToasts((prev) => [...prev, newToast])

          // Auto-remove after 4 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
          }, 4000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--aura-pink)',
              boxShadow: '0 8px 32px rgba(255, 60, 172, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 280
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255, 60, 172, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Flame size={16} style={{ color: 'var(--aura-pink)' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                New Challenger
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--aura-pink)', fontWeight: 600 }}>@{toast.handle}</span> entered the arena!
              </div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
