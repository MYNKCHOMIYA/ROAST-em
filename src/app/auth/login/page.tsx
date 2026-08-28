'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, User, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    
    const supabase = createClient()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })
    
    setLoading(false)
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password.')
      } else {
        setError(signInError.message)
      }
      return
    }
    
    router.push('/feed')
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: 0 }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--aura-pink)', top: '-10%', right: '-5%', opacity: 0.2 }} />
        <div className="glow-orb" style={{ width: 300, height: 300, background: 'var(--aura-purple)', bottom: '5%', left: '-5%', opacity: 0.15, animationDelay: '3s' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} style={{ color: 'var(--aura-pink)' }} />
            <span className="gradient-text-pink" style={{ fontSize: 24, fontWeight: 700 }}>ROAST&apos;em</span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass-card" style={{ padding: '36px 32px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
              Enter your credentials to enter the arena.
            </p>

            <form onSubmit={handleLogin}>
              {/* Email Input */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="email-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 42px',
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${error ? 'rgba(45, 161, 194, 0.5)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      fontFamily: 'Space Grotesk, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = error ? 'rgba(45, 161, 194, 0.5)' : 'var(--border-subtle)'}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="password-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 42px',
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${error ? 'rgba(45, 161, 194, 0.5)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      fontFamily: 'Space Grotesk, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
                    onBlur={(e) => e.target.style.borderColor = error ? 'rgba(45, 161, 194, 0.5)' : 'var(--border-subtle)'}
                  />
                </div>
                
                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ color: 'var(--aura-pink)', fontSize: 12, marginTop: 10 }}>
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: loading || !email || !password ? 0.6 : 1 }}
              >
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              New here?{' '}
              <a href="/auth/signup" style={{ color: 'var(--aura-pink)', textDecoration: 'none', fontWeight: 600 }}>
                Create account
              </a>
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}
        >
          By continuing you agree to our terms. 18+ only.
        </motion.p>
      </div>
    </main>
  )
}
