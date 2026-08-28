'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0, padding: '24px', textAlign: 'center',
    }}>
      {/* Background orb */}
      <div style={{
        position: 'fixed', width: 400, height: 400, borderRadius: '50%',
        background: 'var(--aura-pink)', filter: 'blur(120px)', opacity: 0.08,
        top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ fontSize: 64, marginBottom: 16 }}
        >
          💀
        </motion.div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Something <span style={{ color: 'var(--aura-pink)' }}>exploded</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 28px' }}>
          Even the arena breaks sometimes. This one&apos;s on us, not on your roasting skills.
        </p>

        {error.digest && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace', marginBottom: 20, opacity: 0.6 }}>
            Error ID: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset}
            className="btn-primary" style={{ fontSize: 14 }}>
            <RefreshCw size={15} /> Try Again
          </button>
          <a href="/feed" className="btn-ghost" style={{ fontSize: 14 }}>
            <Flame size={15} /> Back to Feed
          </a>
        </div>
      </motion.div>
    </main>
  )
}
