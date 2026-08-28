'use client'

import { motion } from 'framer-motion'
import { Flame, Zap, Shield, Users, ChevronRight, Star } from 'lucide-react'

const MOCK_ROASTS = [
  {
    id: 1,
    author: 'ShadowFlame42',
    authorAura: 4820,
    target: 'CrispyToast99',
    targetAura: 12400,
    content: 'Bro your last post had the energy of a 404 error — not found, not funny, not valid 💀',
    likes: 312,
    timeAgo: '2m ago',
    color: '#2da1c2',
  },
  {
    id: 2,
    author: 'VoidWalker_X',
    authorAura: 890,
    target: 'NeonGhost7',
    targetAura: 3300,
    content: 'Your personality is literally a loading spinner. Always spinning, never actually doing anything 🌀',
    likes: 180,
    timeAgo: '5m ago',
    color: '#00D4FF',
  },
  {
    id: 3,
    author: 'AcidPixel',
    authorAura: 7100,
    target: 'ShadowFlame42',
    targetAura: 4820,
    content: 'You call that a roast? My toaster has more heat than that. Comeback window is open btw ⏱️',
    likes: 560,
    timeAgo: '11m ago',
    color: '#FF6B35',
  },
]

const FEATURES = [
  {
    icon: Flame,
    title: 'Roast Anyone',
    desc: 'Drop text, GIFs, vids, or pics. No mercy, no remorse. Fully anonymous.',
    color: '#2da1c2',
  },
  {
    icon: Zap,
    title: 'Aura Economy',
    desc: 'Likes = real Aura transfers. Steal from the elite. Every point matters.',
    color: '#FFD200',
  },
  {
    icon: Shield,
    title: '2-Min Comeback',
    desc: 'Got roasted? You have 120 seconds to fire back before points transfer.',
    color: '#00D4FF',
  },
  {
    icon: Users,
    title: 'Stay Anonymous',
    desc: 'One handle per person. Your identity? Locked. Your roasts? Legendary.',
    color: '#784BA0',
  },
]

const STATS = [
  { value: '200', label: 'Starter Aura', suffix: 'pts' },
  { value: '120', label: 'Comeback Window', suffix: 's' },
  { value: '1.5', label: 'Weekly Decay', suffix: '%' },
  { value: '18+', label: 'Age Required', suffix: '' },
]

function AuraRing({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="aura-badge"
      style={{ borderColor: `${color}44`, color, background: `${color}15` }}
    >
      ⚡ {value.toLocaleString()}
    </span>
  )
}

function RoastCard({ roast, index }: { roast: typeof MOCK_ROASTS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card p-5 relative overflow-hidden group cursor-pointer"
      style={{ borderColor: `${roast.color}20` }}
      whileHover={{ y: -4, borderColor: `${roast.color}50` }}
    >
      {/* Glow accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${roast.color}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${roast.color}25`, color: roast.color }}
          >
            {roast.author[0]}
          </div>
          <div>
            <span className="font-semibold text-sm" style={{ color: roast.color }}>
              @{roast.author}
            </span>
            <AuraRing value={roast.authorAura} color={roast.color} />
          </div>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{roast.timeAgo}</span>
      </div>

      {/* Target line */}
      <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <ChevronRight size={12} />
        <span>roasting</span>
        <span className="font-semibold text-white">@{roast.target}</span>
        <AuraRing value={roast.targetAura} color="#784BA0" />
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
        {roast.content}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-1.5 text-xs transition-all hover:scale-110"
          style={{ color: roast.color }}
        >
          <Flame size={14} />
          <span className="font-mono font-bold">{roast.likes}</span>
          <span style={{ color: 'var(--text-secondary)' }}>likes</span>
        </button>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          background: `${roast.color}15`,
          color: roast.color,
          border: `1px solid ${roast.color}30`
        }}>
          −{Math.floor(roast.likes * 0.1)} aura from target
        </span>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100dvh' }}>
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 600, height: 600,
            background: 'var(--aura-pink)',
            top: '-15%', left: '-10%',
            animationDuration: '10s',
          }}
        />
        <div
          className="glow-orb"
          style={{
            width: 500, height: 500,
            background: 'var(--aura-purple)',
            top: '40%', right: '-10%',
            animationDuration: '13s',
            animationDelay: '2s',
          }}
        />
        <div
          className="glow-orb"
          style={{
            width: 300, height: 300,
            background: 'var(--aura-cyan)',
            bottom: '10%', left: '20%',
            animationDuration: '9s',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Nav */}
      <div className="fixed top-6 left-0 right-0 z-50 px-6 pointer-events-none" style={{ display: 'flex', justifyContent: 'center' }}>
        <nav 
          className="glass pointer-events-auto flex items-center justify-between w-full" 
          style={{ 
            maxWidth: 1100, 
            height: 72, 
            padding: '0 24px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.53)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(45, 161, 194, 0.1)', border: '1px solid rgba(45, 161, 194, 0.2)' }}>
              <Flame size={20} style={{ color: 'var(--aura-pink)' }} />
            </div>
            <span className="text-xl font-bold gradient-text-pink" style={{ letterSpacing: '-0.03em' }}>ROAST&apos;em</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <a href="/leaderboard" className="text-sm font-semibold hover:text-white transition-colors" style={{ color: 'var(--text-secondary)', padding: '8px 12px' }}>
              🏆 Leaderboard
            </a>
            <a href="/auth/login" className="text-sm font-semibold hover:text-white transition-colors" style={{ color: 'var(--text-secondary)', padding: '8px 12px' }}>
              Sign In
            </a>
            <a href="/auth/signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
              Try for Free
            </a>
          </motion.div>
        </nav>
      </div>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '180px 24px 100px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 'clamp(52px, 8vw, 96px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              maxWidth: 800,
            }}
          >
            Roast Hard.{' '}
            <span className="gradient-text-pink">Earn Aura.</span>
            <br />
            Stay Anonymous.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <a href="/auth/signup" className="btn-primary" style={{ padding: '16px 36px', fontSize: 16 }}>
              <Flame size={20} />
              Start Roasting
            </a>
            <a href="/leaderboard" className="btn-ghost" style={{ padding: '16px 36px', fontSize: 16 }}>
              🏆 Leaderboard
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>
                  {s.value}<span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 400 }}>{s.suffix}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, marginBottom: 12 }}>
              How the{' '}
              <span className="gradient-text-cyber">Arena</span> Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
              Every action has a price. Every roast has consequences.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass-card"
                style={{ padding: 28 }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${f.color}20`,
                    border: `1px solid ${f.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px 120px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{ padding: '60px 40px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              className="glow-orb"
              style={{
                width: 300, height: 300,
                background: 'var(--aura-pink)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.15,
                filter: 'blur(60px)',
                position: 'absolute',
              }}
            />
            <Star size={32} style={{ color: 'var(--aura-yellow)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, marginBottom: 16 }}>
              Ready to{' '}
              <span className="gradient-text-fire">Catch Smoke</span>?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
              You get 200 Aura points on signup. Don&apos;t waste them. 
              The arena has no safe spaces.
            </p>
            <a href="/auth/signup" className="btn-primary" style={{ fontSize: 17, padding: '14px 36px' }}>
              <Flame size={20} />
              Enter the Arena
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="glass"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          🔥 ROAST&apos;em — For entertainment only. 18+ strictly enforced.
          Be brutal, not a bully.
        </p>
      </footer>
    </main>
  )
}
