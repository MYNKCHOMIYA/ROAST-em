import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { handleToColor } from '@/lib/utils'

interface FollowListModalProps {
  userId: string
  type: 'followers' | 'following'
  onClose: () => void
}

export function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfiles() {
      const supabase = createClient()
      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower:profiles!follows_follower_id_fkey(id, handle, aura_points, avatar_url)')
          .eq('following_id', userId)
          
        const profs = data?.map(d => d.follower).filter(Boolean) as any as Profile[]
        setProfiles(profs || [])
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following:profiles!follows_following_id_fkey(id, handle, aura_points, avatar_url)')
          .eq('follower_id', userId)

        const profs = data?.map(d => d.following).filter(Boolean) as any as Profile[]
        setProfiles(profs || [])
      }
      setLoading(false)
    }
    fetchProfiles()
  }, [userId, type])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="glass-card"
        style={{
          position: 'relative', width: '100%', maxWidth: 400,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', padding: 0
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profiles.map(prof => {
                const pColor = handleToColor(prof.handle)
                return (
                  <a key={prof.id} href={`/u/${prof.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: `${pColor}20`, border: `2px solid ${pColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: pColor,
                    }}>
                      {prof.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={prof.avatar_url} alt={prof.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : prof.handle[0].toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>@{prof.handle}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{prof.aura_points} aura</div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
