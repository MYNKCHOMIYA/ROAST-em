import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format aura points with k/M suffixes */
export function formatAura(points: number): string {
  if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M`
  if (points >= 1_000) return `${(points / 1_000).toFixed(1)}k`
  return points.toString()
}

/** Get a deterministic color for a user handle (avatar fallback) */
export function handleToColor(handle: string): string {
  const colors = [
    '#FF3CAC', '#784BA0', '#2B86C5', // pink-purple-blue
    '#F7971E', '#FFD200',             // orange-yellow
    '#56CCF2', '#2F80ED',             // cyan-blue
    '#EB5757', '#F2994A',             // red-orange
  ]
  let hash = 0
  for (let i = 0; i < handle.length; i++) hash = handle.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

/** Relative time (e.g. "2m ago") */
export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
