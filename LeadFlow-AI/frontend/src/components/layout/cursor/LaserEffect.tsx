import { useEffect, useState } from 'react'

interface LaserEffectProps {
  x: number; y: number; angle: number; firing: boolean
}

export default function LaserEffect({ x, y, angle, firing }: LaserEffectProps) {
  const [visible, setVisible] = useState(false)
  const [sparks, setSparks] = useState<{ id: number; dx: number; dy: number }[]>([])

  useEffect(() => {
    if (!firing) return
    setVisible(true)
    setSparks(Array.from({ length: 6 }, (_, i) => ({
      id: i,
      dx: Math.cos((i / 6) * Math.PI * 2) * (10 + Math.random() * 10),
      dy: Math.sin((i / 6) * Math.PI * 2) * (10 + Math.random() * 10),
    })))
    const t = setTimeout(() => { setVisible(false); setSparks([]) }, 200)
    return () => clearTimeout(t)
  }, [firing])

  if (!visible) return null

  const rad = (angle - 90) * (Math.PI / 180)
  const laserLen = 60
  const ex = x + Math.cos(rad) * laserLen
  const ey = y + Math.sin(rad) * laserLen

  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99996 }}>
      <defs>
        <filter id="laserGlow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Laser beam */}
      <line x1={x} y1={y} x2={ex} y2={ey} stroke="#00D4FF" strokeWidth="2" filter="url(#laserGlow)" opacity="0.9" />
      <line x1={x} y1={y} x2={ex} y2={ey} stroke="white" strokeWidth="0.8" opacity="0.8" />
      {/* Muzzle flash */}
      <circle cx={x} cy={y} r="5" fill="rgba(0,212,255,0.8)" filter="url(#laserGlow)" />
      {/* Impact sparks */}
      {sparks.map(s => (
        <line key={s.id}
          x1={ex} y1={ey}
          x2={ex + s.dx} y2={ey + s.dy}
          stroke="#00D4FF" strokeWidth="1" opacity="0.7"
          filter="url(#laserGlow)"
        />
      ))}
    </svg>
  )
}