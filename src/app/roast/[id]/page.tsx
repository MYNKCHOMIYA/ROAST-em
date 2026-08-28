'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, MessageSquareOff } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, RoastWithProfiles } from '@/lib/types'
import RoastCard from '@/components/RoastCard'
import { getCurrentProfile } from '@/lib/api'

export default function RoastDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roastId = params.id as string

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [roast, setRoast] = useState<RoastWithProfiles | null>(null)
  const [comebacks, setComebacks] = useState<RoastWithProfiles[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profile = await getCurrentProfile()
        setCurrentUser(profile)

        const supabase = createClient()
        
        // Fetch the main roast
        const { data: mainRoast } = await supabase
          .from('roasts')
          .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
          .eq('id', roastId)
          .single()
        
        if (mainRoast) {
          setRoast(mainRoast as RoastWithProfiles)

          // Fetch comebacks (roasts where parent_roast_id is this roast)
          // Wait, the schema has parent_roast_id? Yes: `parent_roast_id UUID REFERENCES public.roasts(id)`
          const { data: comebackData } = await supabase
            .from('roasts')
            .select('*, author:profiles!roasts_author_id_fkey(id,handle,aura_points,avatar_url), target:profiles!roasts_target_id_fkey(id,handle,aura_points,avatar_url)')
            .eq('parent_roast_id', roastId)
            .order('created_at', { ascending: true })

          setComebacks((comebackData ?? []) as RoastWithProfiles[])
        }
      } catch (err) {
        console.error('Failed to load roast thread', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roastId])

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--aura-pink)', animation: 'spin 1s linear infinite' }} />
      </main>
    )
  }

  if (!roast) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-base)', padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>👻</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Roast Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This roast was either deleted or never existed.</p>
        <button onClick={() => router.push('/feed')} className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: 14 }}>
          Back to Feed
        </button>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Nav */}
      <nav className="glass" style={{ borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 58 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
          </button>
          <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 700 }}>Roast Thread</span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Main Roast */}
        <RoastCard roast={roast} currentUser={currentUser} />

        {/* Thread divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <div style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Comebacks
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Comebacks */}
        {comebacks.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.8 }}>
            <MessageSquareOff size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No comebacks yet. Target was left speechless.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
            {/* Thread vertical line connecting comebacks visually */}
            <div style={{ position: 'absolute', top: 20, bottom: 20, left: 34, width: 2, background: 'var(--border-subtle)', zIndex: 0 }} />
            
            {comebacks.map((comeback) => (
              <div key={comeback.id} style={{ position: 'relative', zIndex: 1, paddingLeft: 16 }}>
                <RoastCard roast={comeback} currentUser={currentUser} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
