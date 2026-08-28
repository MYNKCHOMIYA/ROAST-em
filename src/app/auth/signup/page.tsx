'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ArrowRight, Loader2, User, Lock, Mail, Shield, Check, Plus, Minus } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ADJECTIVES = ['Shadow', 'Neon', 'Void', 'Acid', 'Crispy', 'Ghost', 'Static', 'Blaze', 'Toxic', 'Hyper']
const NOUNS = ['Flame', 'Pixel', 'Walker', 'Toast', 'Storm', 'Cipher', 'Wraith', 'Punch', 'Roaster', 'Legend']

function randomHandle() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}

function OdometerDigit({ digit }: { digit: string }) {
  if (digit < '0' || digit > '9') return null
  return (
    <div style={{ height: '48px', overflow: 'hidden', position: 'relative', width: '32px' }}>
      <motion.div
        initial={false}
        animate={{ y: `-${parseInt(digit) * 48}px` }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div key={num} style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {num}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function BirthYearOdometer({ year, setYear }: { year: number, setYear: (y: number) => void }) {
  const padded = year.toString().padStart(4, '0')
  const currentYear = new Date().getFullYear()
  const age = currentYear - year

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Confirm Your Birth Year
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => setYear(Math.max(1900, year - 1))} className="btn-ghost" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
          <Minus size={20} />
        </button>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${age >= 18 ? 'var(--aura-pink)' : 'var(--border-subtle)'}`, boxShadow: age >= 18 ? '0 0 20px rgba(255, 60, 172, 0.2)' : 'none', transition: 'all 0.3s' }}>
          {padded.split('').map((char, i) => (
            <OdometerDigit key={i} digit={char} />
          ))}
        </div>
        <button type="button" onClick={() => setYear(Math.min(currentYear, year + 1))} className="btn-ghost" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [handle, setHandle] = useState(randomHandle)
  const currentYear = new Date().getFullYear()
  const [birthYear, setBirthYear] = useState(currentYear - 17) // Start at 17 years old to encourage interaction
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ageConfirmed = (currentYear - birthYear) >= 18

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!handle.trim() || handle.length < 3) { setError('Handle must be at least 3 characters.'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) { setError('Handle can only contain letters, numbers and underscores.'); return }
    if (!ageConfirmed) { setError('You must be 18 or older to enter the arena.'); return }

    setLoading(true)
    const supabase = createClient()

    // 1. Sign up with email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    if (!authData.user) {
      setLoading(false)
      setError('Unknown error creating account.')
      return
    }

    // 2. Create Profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      handle: handle.trim(),
      aura_points: 200,
      // phone_hash is permanently removed from requirements
    })

    setLoading(false)
    if (profileError) {
      if (profileError.code === '23505') setError('That handle is already taken. Pick another!')
      else setError(profileError.message)
      return
    }
    
    router.push('/feed?welcome=1')
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', flexDirection: 'column', gap: 0 }}>
      {!isSupabaseConfigured() && (
        <div style={{ width: '100%', maxWidth: 440, marginBottom: 12 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--aura-orange)', lineHeight: 1.5 }}>
            ⚠️ <strong>Dev Mode:</strong> Supabase not configured. Add keys to <code style={{ fontFamily: 'Space Mono, monospace' }}>.env.local</code> to enable auth.
          </div>
        </div>
      )}
      
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb" style={{ width: 500, height: 500, background: 'var(--aura-purple)', top: '-15%', left: '-10%', opacity: 0.2 }} />
        <div className="glow-orb" style={{ width: 300, height: 300, background: 'var(--aura-cyan)', bottom: '10%', right: '5%', opacity: 0.15, animationDelay: '4s' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} style={{ color: 'var(--aura-pink)' }} />
            <span className="gradient-text-pink" style={{ fontSize: 24, fontWeight: 700 }}>ROAST&apos;em</span>
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="glass-card" style={{ padding: '36px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Create your identity</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                You start with <span style={{ color: 'var(--aura-yellow)', fontWeight: 700 }}>200 Aura</span>. Choose your alias wisely.
              </p>
            </div>

            <form onSubmit={handleSignup}>
              
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="email-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input id="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--bg-elevated)', border: `1px solid ${error.includes('email') ? 'rgba(255,60,172,0.5)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="password-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="confirm-password-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Retype Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input id="confirm-password-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--bg-elevated)', border: `1px solid ${confirmPassword && password !== confirmPassword ? 'rgba(255,60,172,0.5)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '24px 0' }} />

              {/* Handle */}
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="handle-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Your Handle (anonymous username)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--aura-pink)', fontSize: 15, fontWeight: 600 }}>@</span>
                    <input id="handle-input" type="text" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={20} placeholder="YourHandle"
                      style={{ width: '100%', padding: '13px 14px 13px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    />
                  </div>
                  <button type="button" onClick={() => setHandle(randomHandle())} className="btn-ghost" style={{ padding: '13px 16px', fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap' }} title="Random handle">
                    🎲
                  </button>
                </div>
              </div>

              {/* Age Odometer */}
              <BirthYearOdometer year={birthYear} setYear={setBirthYear} />

              {/* Age Gate Checkbox */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px', borderRadius: 'var(--radius-md)', background: ageConfirmed ? 'rgba(255,60,172,0.08)' : 'var(--bg-elevated)', border: `1px solid ${ageConfirmed ? 'rgba(255,60,172,0.3)' : 'var(--border-subtle)'}`, transition: 'all 0.2s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, background: ageConfirmed ? 'linear-gradient(135deg, var(--aura-pink), var(--aura-purple))' : 'var(--bg-base)', border: `1px solid ${ageConfirmed ? 'transparent' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {ageConfirmed && <Check size={13} color="white" strokeWidth={3} />}
                  </div>
                  <input type="checkbox" checked={ageConfirmed} readOnly style={{ display: 'none' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Shield size={14} style={{ color: 'var(--aura-pink)' }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>I confirm I am 18 or older</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      ROAST&apos;em contains harsh content. You must be 18+ to participate.
                    </p>
                  </div>
                </label>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--aura-pink)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button id="create-profile-btn" type="submit" disabled={loading || !ageConfirmed || !handle || !password || !email} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: loading || !ageConfirmed || !handle || !password || !email ? 0.6 : 1 }}>
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Flame size={18} />}
                {loading ? 'Creating account...' : 'Enter the Arena 🔥'}
              </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              Already roasting?{' '}
              <a href="/auth/login" style={{ color: 'var(--aura-pink)', textDecoration: 'none', fontWeight: 600 }}>Log in</a>
            </p>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
          No real names. No mercy. Stay anonymous.
        </motion.p>
      </div>
    </main>
  )
}
