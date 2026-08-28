'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Save, Shield, Zap, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { handleToColor, formatAura } from '@/lib/utils'
import type { Profile } from '@/lib/types'

export default function ProfileEditPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shieldLoading, setShieldLoading] = useState(false)
  const [shieldError, setShieldError] = useState('')
  const [shieldSuccess, setShieldSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data) { router.push('/auth/signup'); return }
      setProfile(data as Profile)
      setBio(data.bio ?? '')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleActivateShield() {
    if (!profile) return
    setShieldLoading(true); setShieldError('')
    const supabase = createClient()
    const { error: err } = await supabase.rpc('activate_shield')
    if (err) { setShieldError(err.message); setShieldLoading(false); return }
    // Refresh profile
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
    if (data) setProfile(data as Profile)
    setShieldLoading(false)
    setShieldSuccess(true)
    setTimeout(() => setShieldSuccess(false), 3000)
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  const color = handleToColor(profile!.handle)
  const isShielded = profile!.shield_until && new Date(profile!.shield_until) > new Date()
  const shieldHoursLeft = isShielded
    ? Math.ceil((new Date(profile!.shield_until!).getTime() - Date.now()) / 3_600_000)
    : 0

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 58 }}>
          <button onClick={() => router.push('/profile')}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Edit Profile</span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 80px' }}>

        {/* Profile header preview */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `${color}20`, border: `2px solid ${color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color,
          }}>
            {profile!.handle[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color }}>@{profile!.handle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <Zap size={12} style={{ color: 'var(--aura-yellow)' }} />
              <span style={{ fontSize: 13, color: 'var(--aura-yellow)', fontWeight: 700 }}>{formatAura(profile!.aura_points)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>aura</span>
            </div>
          </div>
        </div>

        {/* Bio form */}
        <section className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bio</h2>
          <form onSubmit={handleSaveBio}>
            <textarea
              id="bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Say something about yourself. Keep it sharp."
              style={{
                width: '100%', padding: '12px', resize: 'none',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
                transition: 'border-color 0.2s', lineHeight: 1.6,
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--aura-pink)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace' }}>
                {bio.length}/160
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {error && <span style={{ fontSize: 12, color: 'var(--aura-pink)' }}>{error}</span>}
                <motion.button
                  id="save-bio-btn"
                  type="submit"
                  disabled={saving}
                  animate={saved ? { backgroundColor: 'rgba(39,201,150,0.2)' } : {}}
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '7px 16px' }}
                >
                  {saved ? <><Check size={14} /> Saved!</> : saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                  {saved ? '' : saving ? 'Saving...' : 'Save Bio'}
                </motion.button>
              </div>
            </div>
          </form>
        </section>

        {/* Shield section */}
        <section className="glass-card" style={{
          padding: '20px',
          borderColor: isShielded ? 'rgba(86,204,242,0.35)' : 'var(--border-subtle)',
          background: isShielded ? 'rgba(86,204,242,0.04)' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: isShielded ? 'rgba(86,204,242,0.15)' : 'var(--bg-elevated)',
              border: `1px solid ${isShielded ? '#56CCF2' : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={20} style={{ color: isShielded ? '#56CCF2' : 'var(--text-secondary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Aura Shield
                {isShielded && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#56CCF2', background: 'rgba(86,204,242,0.15)', padding: '2px 9px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    ACTIVE — {shieldHoursLeft}h left
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                {isShielded
                  ? `You're shielded! When people like roasts against you, your Aura won't be burned for the next ${shieldHoursLeft} hours.`
                  : 'Spend 50 Aura to protect yourself for 48 hours. While shielded, roasters earn Aura from likes but you don\'t lose any.'}
              </p>
              {!isShielded && (
                <div>
                  <button
                    id="activate-shield-btn"
                    onClick={handleActivateShield}
                    disabled={shieldLoading || (profile!.aura_points ?? 0) < 50}
                    className="btn-ghost"
                    style={{
                      fontSize: 13, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 7,
                      borderColor: '#56CCF2', color: '#56CCF2',
                      opacity: (profile!.aura_points ?? 0) < 50 ? 0.5 : 1,
                    }}
                  >
                    {shieldLoading
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Shield size={14} />
                    }
                    {shieldLoading ? 'Activating...' : 'Activate Shield (-50 Aura)'}
                  </button>
                  {(profile!.aura_points ?? 0) < 50 && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                      You need at least 50 Aura to activate a Shield.
                    </p>
                  )}
                  {shieldError && <p style={{ fontSize: 12, color: 'var(--aura-pink)', marginTop: 6 }}>{shieldError}</p>}
                  {shieldSuccess && <p style={{ fontSize: 12, color: '#56CCF2', marginTop: 6 }}>🛡️ Shield activated! You're protected for 48 hours.</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Aura economy info */}
        <div className="glass-card" style={{ padding: '16px 18px', marginTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            💡 <strong>Aura Decay:</strong> Aura decays by ~1.5% every Sunday. Stay active to keep your score up.
            Min floor is 200 — you can never go below your starting Aura.
          </p>
        </div>
      </div>
    </main>
  )
}
