import { useEffect, useRef, useState } from 'react'
import Ship from './Ship'
import EngineTrail from './EngineTrail'
import ExhaustParticles from './ExhaustParticles'
import LaserEffect from './LaserEffect'

interface TrailPoint { x: number; y: number; age: number; speed: number }

export default function SpaceshipCursor() {
  // Ship position (smoothly interpolated)
  const shipX = useRef(window.innerWidth / 2)
  const shipY = useRef(window.innerHeight / 2)

  // Raw mouse position
  const mouseX = useRef(window.innerWidth / 2)
  const mouseY = useRef(window.innerHeight / 2)

  // Velocity for rotation
  const velX = useRef(0)
  const velY = useRef(0)
  const prevX = useRef(shipX.current)
  const prevY = useRef(shipY.current)

  // Rendered state (only updates that matter for React)
  const [pos, setPos] = useState({ x: shipX.current, y: shipY.current })
  const [tilt, setTilt] = useState(0)
  const [glowIntensity, setGlowIntensity] = useState(1)
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const [isHovering, setIsHovering] = useState(false)
  const [firing, setFiring] = useState(false)
  const [fireAngle, setFireAngle] = useState(0)
  const [recoil, setRecoil] = useState(0)

  // Idle float
  const idleT = useRef(0)
  const lastMoveT = useRef(Date.now())
  const rafRef = useRef<number>(0)

  const trailRef = useRef<TrailPoint[]>([])

  // Hide default cursor
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = '* { cursor: none !important; }'
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  // Mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
      lastMoveT.current = Date.now()
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Hover detection
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      setIsHovering(!!t.closest('button, a, [role="button"], .card, input'))
    }
    document.addEventListener('mouseover', onOver)
    return () => document.removeEventListener('mouseover', onOver)
  }, [])

  // Click → laser
  useEffect(() => {
    const onClick = () => {
      const angle = Math.atan2(velY.current, velX.current) * (180 / Math.PI) + 90
      setFireAngle(angle)
      setFiring(f => !f) // toggle to re-trigger effect
      setRecoil(1)
      setTimeout(() => setRecoil(0), 150)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  // Main animation loop
  useEffect(() => {
    const loop = () => {
      const ease = isHovering ? 0.18 : 0.10

      // Smooth follow
      shipX.current += (mouseX.current - shipX.current) * ease
      shipY.current += (mouseY.current - shipY.current) * ease

      // Velocity
      velX.current = shipX.current - prevX.current
      velY.current = shipY.current - prevY.current
      prevX.current = shipX.current
      prevY.current = shipY.current

      const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2)

      // Idle float
      const idle = Date.now() - lastMoveT.current > 800
      if (idle) {
        idleT.current += 0.02
        shipY.current += Math.sin(idleT.current) * 0.3
      }

      // Tilt based on horizontal velocity
      const targetTilt = velX.current * 4 + (recoil ? -6 : 0)

      // Trail
      const newPoint: TrailPoint = {
        x: shipX.current,
        y: shipY.current + 14,
        age: 0,
        speed,
      }
      trailRef.current = [
        newPoint,
        ...trailRef.current.map(p => ({ ...p, age: p.age + 0.04 })).filter(p => p.age < 1),
      ].slice(0, 30)

      setPos({ x: shipX.current, y: shipY.current })
      setTilt(targetTilt)
      setGlowIntensity(isHovering ? 3 : 1 + speed * 0.3)
      setTrail([...trailRef.current])

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isHovering, recoil])

  return (
    <>
      {/* Engine trail */}
      <EngineTrail points={trail} />

      {/* Exhaust particles on hover */}
      <ExhaustParticles x={pos.x} y={pos.y} active={isHovering} />

      {/* Laser on click */}
      <LaserEffect x={pos.x} y={pos.y} angle={fireAngle} firing={firing} />

      {/* The ship */}
      <div style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform',
      }}>
        <Ship tiltX={tilt} glowIntensity={glowIntensity} />
      </div>
    </>
  )
}