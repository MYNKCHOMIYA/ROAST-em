import React from 'react'
import Link from 'next/link'

export function RoastText({ text }: { text: string | null | undefined }) {
  if (!text) return null

  // Split text by @handle mentions
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const handle = part.substring(1)
          return (
            <Link
              key={i}
              href={`/u/${handle}`}
              style={{
                color: 'var(--aura-pink)',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              {part}
            </Link>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
