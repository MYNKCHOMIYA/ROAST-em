'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, User, Lock, Phone, AlertTriangle, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, scheduleAccountDeletion, hardDeleteAccount } from '@/lib/actions/profile'
import { updatePassword, updateEmail } from '@/lib/actions/auth'

export default function SettingsPage() {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [loading, setLoading] = useState({ profile: false, password: false, email: false, delete: false })
  const [message, setMessage] = useState({ profile: '', password: '', email: '', delete: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      
      if (user.email) setEmail(user.email)

      const { data: prof } = await supabase.from('profiles').select('handle').eq('id', user.id).single()
      if (prof) setHandle(prof.handle)
    }
    load()
  }, [router])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(prev => ({ ...prev, profile: true }))
    setMessage(prev => ({ ...prev, profile: '' }))
    const res = await updateProfile({ handle })
    setLoading(prev => ({ ...prev, profile: false }))
    if (res.error) setMessage(prev => ({ ...prev, profile: `Error: ${res.error}` }))
    else setMessage(prev => ({ ...prev, profile: 'Profile updated successfully!' }))
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage(prev => ({ ...prev, password: 'Passwords do not match.' }))
      return
    }
    setLoading(prev => ({ ...prev, password: true }))
    setMessage(prev => ({ ...prev, password: '' }))
    const res = await updatePassword(password)
    setLoading(prev => ({ ...prev, password: false }))
    if (res.error) setMessage(prev => ({ ...prev, password: `Error: ${res.error}` }))
    else {
      setMessage(prev => ({ ...prev, password: 'Password securely updated!' }))
      setPassword('')
      setConfirmPassword('')
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(prev => ({ ...prev, email: true }))
    setMessage(prev => ({ ...prev, email: '' }))
    const res = await updateEmail(email)
    setLoading(prev => ({ ...prev, email: false }))
    if (res.error) setMessage(prev => ({ ...prev, email: `Error: ${res.error}` }))
    else {
      setMessage(prev => ({ ...prev, email: 'Email updated successfully!' }))
      setEmail('')
    }
  }

  async function handleDeleteAccount(mode: 'hard' | 'soft') {
    setLoading(prev => ({ ...prev, delete: true }))
    const res = mode === 'hard' ? await hardDeleteAccount() : await scheduleAccountDeletion()
    if (res.error) {
      setMessage(prev => ({ ...prev, delete: `Error: ${res.error}` }))
      setLoading(prev => ({ ...prev, delete: false }))
      setShowDeleteConfirm(false)
    } else {
      router.push('/')
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, marginTop: 24 }}>
          <button onClick={() => router.push('/profile')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Profile Settings */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <User size={20} style={{ color: 'var(--aura-pink)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Profile</h2>
            </div>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Username / Handle</label>
                <input type="text" value={handle} onChange={e => setHandle(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none' }} />
              </div>
              {message.profile && <div style={{ fontSize: 13, color: message.profile.includes('Error') ? 'red' : 'var(--aura-cyan)' }}>{message.profile}</div>}
              <button type="submit" disabled={loading.profile} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 14 }}>
                {loading.profile ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
              </button>
            </form>
          </section>

          {/* Security */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Lock size={20} style={{ color: 'var(--aura-cyan)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Security</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Passwords are securely hashed using industry-standard protocols before storage.</p>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none', marginBottom: 12 }} />
                  
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none' }} />
              </div>
              {message.password && <div style={{ fontSize: 13, color: message.password.includes('Error') || message.password.includes('not match') ? 'red' : 'var(--aura-cyan)' }}>{message.password}</div>}
              <button type="submit" disabled={loading.password || !password || !confirmPassword} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 14 }}>
                {loading.password ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Email Update */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <User size={20} style={{ color: 'var(--aura-purple)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Email Address</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Update the email address associated with your account.</p>
            
            <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', outline: 'none' }} />
              </div>
              {message.email && <div style={{ fontSize: 13, color: message.email.includes('Error') ? 'red' : 'var(--aura-cyan)' }}>{message.email}</div>}
              <button type="submit" disabled={loading.email || !email} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 14 }}>
                {loading.email ? <Loader2 size={16} className="animate-spin" /> : 'Update Email'}
              </button>
            </form>
          </section>

          {/* Danger Zone */}
          <section className="glass-card" style={{ padding: '24px', border: '1px solid rgba(255, 60, 172, 0.2)', background: 'linear-gradient(135deg, rgba(255, 60, 172, 0.05) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertTriangle size={20} style={{ color: 'var(--aura-orange)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--aura-orange)' }}>Danger Zone</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Deleting your account is irreversible. Once confirmed, your account will be soft-deleted immediately and permanently wiped after 15 days of inactivity.
            </p>
            {message.delete && <div style={{ fontSize: 13, color: 'red', marginBottom: 12 }}>{message.delete}</div>}
            <button onClick={() => setShowDeleteConfirm(true)} disabled={loading.delete}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 60, 172, 0.1)', color: '#FF3CAC', border: '1px solid rgba(255, 60, 172, 0.3)', padding: '10px 20px', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {loading.delete ? <Loader2 size={16} className="animate-spin" /> : 'Delete Account'}
            </button>
          </section>
          
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card" style={{ position: 'relative', width: '100%', maxWidth: 420, padding: 28, border: '1px solid rgba(255, 60, 172, 0.4)', boxShadow: '0 20px 60px rgba(255,60,172,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255, 60, 172, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} style={{ color: 'var(--aura-pink)' }} />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: 'white', margin: 0 }}>Delete Account</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Choose how you want to delete your account. This action can have serious consequences.
              </p>

              {message.delete && <p style={{ fontSize: 12, color: 'var(--aura-pink)', marginBottom: 16 }}>{message.delete}</p>}

              {/* Option A: Grace Period */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>⏳ 15-Day Grace Period</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                  Your account is hidden immediately. You can log back in anytime in the next <strong style={{ color: 'white' }}>15 days</strong> to restore it. After 15 days, your data is permanently wiped.
                </p>
                <button
                  onClick={() => handleDeleteAccount('soft')}
                  disabled={loading.delete}
                  className="btn-ghost"
                  style={{ width: '100%', padding: '10px', fontSize: 14, borderColor: 'rgba(255,200,60,0.4)', color: '#FFD200', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading.delete ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Start Grace Period
                </button>
              </div>

              {/* Option B: Delete Now */}
              <div style={{ background: 'rgba(255,60,172,0.05)', border: '1px solid rgba(255,60,172,0.25)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--aura-pink)' }}>💀 Delete Now</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                  Your account, all roasts, follows, aura — everything is <strong style={{ color: 'var(--aura-pink)' }}>permanently wiped immediately</strong>. No recovery possible.
                </p>
                <button
                  onClick={() => handleDeleteAccount('hard')}
                  disabled={loading.delete}
                  style={{ width: '100%', padding: '10px', fontSize: 14, background: 'rgba(255,60,172,0.15)', color: 'var(--aura-pink)', border: '1px solid rgba(255,60,172,0.4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}
                >
                  {loading.delete ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  Delete Everything Now
                </button>
              </div>

              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost" style={{ width: '100%', padding: '9px', fontSize: 13 }}>
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
