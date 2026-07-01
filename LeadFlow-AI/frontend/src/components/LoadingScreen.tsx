import { useState, useEffect } from 'react'

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true)
      setTimeout(onComplete, 400)
    }, 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="loading-screen"
      style={{ opacity: done ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: done ? 'none' : 'all' }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#5E6AD2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
        }}>
          LF
        </div>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '1rem', fontWeight: 600,
          color: '#F4F4F5', letterSpacing: '-0.01em',
        }}>
          LeadFlow
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ animationDuration: '1.6s' }} />
      </div>

      <p style={{ fontSize: '0.75rem', color: '#52525B', marginTop: 16 }}>
        Loading your pipeline…
      </p>
    </div>
  )
}