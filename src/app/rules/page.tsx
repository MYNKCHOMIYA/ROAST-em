'use client'

import { motion } from 'framer-motion'
import { Flame, Shield, Zap, Info, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function RulesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 60, 172, 0.1)', border: '1px solid rgba(255, 60, 172, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={32} style={{ color: 'var(--aura-pink)' }} />
          </div>
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
          The <span className="gradient-text-pink">Rulebook</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          ROAST'em is the ultimate anonymous roasting arena. Before you enter, you must understand the laws of the Aura Economy and the Prime Directive.
        </p>
      </div>

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: 24, border: '1px solid rgba(255, 60, 172, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Shield size={24} style={{ color: 'var(--aura-pink)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>1. The Prime Directive: Stay Anonymous</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            You have one alias. Protect it. <strong style={{ color: 'var(--text-primary)' }}>Do not expose your real identity, and NEVER dox or expose the real identity of others.</strong> 
            Sharing phone numbers, addresses, real names, or exact locations is an instant, permanent ban.
          </p>
          <div style={{ background: 'rgba(255, 60, 172, 0.08)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 60, 172, 0.2)', fontSize: 13, color: 'var(--aura-pink)' }}>
            <strong>18+ Only:</strong> By participating, you acknowledge you are an adult in an unfiltered environment.
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Zap size={24} style={{ color: 'var(--aura-yellow)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>2. The Aura Economy</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            Aura is your lifeblood. You start with <strong>200 Aura</strong>. Here is how you manipulate it:
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--aura-green)' }}>+</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}><strong>Earn Aura:</strong> When someone likes a roast you wrote, you gain 10 Aura. (The person who liked it spends 10 Aura).</span>
            </li>
            <li style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--aura-pink)' }}>⚔️</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}><strong>Underdog Rewards:</strong> If you roast someone who has MORE Aura than you, and they fail to fire back in time, the Underdog System activates. For every 100 Aura your roast gains (10 likes), you steal 10 Aura directly from them! This stops forever once your Aura surpasses theirs.</span>
            </li>
            <li style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--aura-purple)' }}>📉</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}><strong>Weekly Decay:</strong> To prevent hoarding, all accounts above 200 Aura lose 1.5% of their Aura every week.</span>
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Info size={24} style={{ color: 'var(--aura-cyan)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>3. The Comeback Window</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Got roasted? Don't just sit there. You have exactly <strong>120 seconds (2 minutes)</strong> to reply to a roast directed at you. If you fire back within the window, you lock the thread. If you don't, the roast stands uncontested forever.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Zap size={24} style={{ color: 'var(--aura-orange)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>4. One Account Per Person</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ROAST'em is a free, independently developed project. To preserve our limited database storage and ensure a fair Aura economy, <strong>alt accounts are strictly prohibited</strong>. Creating multiple accounts to manipulate your feed, hoard Aura, or harass others will result in all your accounts being permanently banned.
          </p>
        </motion.div>

      </div>

      {isOnboarding ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => router.push('/feed')} className="btn-primary" style={{ padding: '16px 32px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            I Understand. Enter the Arena. <ChevronRight size={18} />
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => router.back()} className="btn-ghost" style={{ padding: '12px 24px' }}>
            Go Back
          </button>
        </div>
      )}

    </div>
  )
}

export default function RulesPage() {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading rulebook...</div>}>
        <RulesContent />
      </Suspense>
    </main>
  )
}
