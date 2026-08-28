import { motion } from 'framer-motion'
import { Flame, Search } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Lost in the Arena',
}

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        position: 'fixed', width: 400, height: 400, borderRadius: '50%',
        background: 'var(--aura-purple)', filter: 'blur(120px)', opacity: 0.08,
        top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Glitchy 404 */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <h1 style={{
            fontSize: 120, fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, var(--aura-pink), var(--aura-purple))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: 'Space Mono, monospace', letterSpacing: '-4px',
          }}>
            404
          </h1>
        </div>

        <div style={{ fontSize: 40, marginBottom: 16 }}>👻</div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Page Vanished
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
          This page got roasted so hard it stopped existing.
          Or maybe you just typed the wrong URL.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/feed" className="btn-primary" style={{ fontSize: 14 }}>
            <Flame size={15} /> Back to Feed
          </a>
          <a href="/search" className="btn-ghost" style={{ fontSize: 14 }}>
            <Search size={15} /> Find Someone to Roast
          </a>
        </div>
      </div>
    </main>
  )
}
