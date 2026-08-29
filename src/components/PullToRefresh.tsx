'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Loader2, ArrowDown } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const controls = useAnimation()
  const MAX_PULL = 100
  const THRESHOLD = 60

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return
    const currentY = e.touches[0].clientY
    const distance = currentY - startY
    
    // Only pull down when at the top
    if (distance > 0 && window.scrollY === 0) {
      // Add resistance
      const pull = Math.min(distance * 0.4, MAX_PULL)
      setPullDistance(pull)
      
      // We don't preventDefault here because it breaks scrolling on some devices,
      // but we do apply overscrollBehavior none in useEffect
    }
  }

  const handleTouchEnd = async () => {
    if (startY === 0) return
    
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back if threshold not met
      setPullDistance(0)
    }
    setStartY(0)
  }

  // Handle native behavior conflicts
  useEffect(() => {
    if (pullDistance > 0) {
      document.body.style.overscrollBehaviorY = 'none'
    } else {
      document.body.style.overscrollBehaviorY = 'auto'
    }
    return () => {
      document.body.style.overscrollBehaviorY = 'auto'
    }
  }, [pullDistance])

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100dvh' }}
    >
      <div 
        style={{ 
          position: 'fixed', 
          top: 70, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          zIndex: 40,
          pointerEvents: 'none'
        }}
      >
        <motion.div
          animate={{
            y: isRefreshing ? 20 : (pullDistance > 0 ? pullDistance - 50 : -50),
            scale: isRefreshing ? 1 : (pullDistance > 0 ? Math.min(pullDistance / THRESHOLD, 1) : 0),
            opacity: isRefreshing ? 1 : (pullDistance > 0 ? 1 : 0),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            color: 'var(--text-primary)'
          }}
        >
          {isRefreshing ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ArrowDown 
              size={18} 
              style={{ transform: `rotate(${Math.min((pullDistance / THRESHOLD) * 180, 180)}deg)` }} 
            />
          )}
        </motion.div>
      </div>
      <motion.div 
        animate={{ y: isRefreshing ? 40 : pullDistance * 0.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ position: 'relative', zIndex: 10 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
