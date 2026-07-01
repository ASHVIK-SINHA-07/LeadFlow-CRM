import { useEffect, useRef, useState } from 'react'

interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; size: number }

interface ExhaustParticlesProps {
  x: number; y: number; active: boolean
}

export default function ExhaustParticles({ x, y, active }: ExhaustParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const idRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return

    const spawn = () => {
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180)
      const speed = 0.5 + Math.random() * 1.5
      const newP: Particle = {
        id: idRef.current++,
        x, y: y + 14,
        vx: Math.sin(angle) * speed,
        vy: speed * Math.cos(angle),
        life: 1,
        size: 1.5 + Math.random() * 2,
      }
      setParticles(ps => [...ps.slice(-20), newP])
    }

    const interval = setInterval(spawn, 30)
    return () => clearInterval(interval)
  }, [x, y, active])

  useEffect(() => {
    const tick = () => {
      setParticles(ps =>
        ps.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.04 }))
          .filter(p => p.life > 0)
      )
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99994 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x, top: p.y,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: `rgba(0,${150 + Math.round(p.life * 100)},255,${p.life * 0.8})`,
          transform: 'translate(-50%,-50%)',
          boxShadow: `0 0 ${p.size * 2}px rgba(0,212,255,${p.life * 0.5})`,
        }} />
      ))}
    </div>
  )
}