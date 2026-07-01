import { } from 'react'

interface TrailPoint { x: number; y: number; age: number; speed: number }

interface EngineTrailProps {
  points: TrailPoint[]
}

export default function EngineTrail({ points }: EngineTrailProps) {
  if (points.length < 2) return null

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99995 }}
    >
      {points.map((pt, i) => {
        if (i === 0) return null
        const prev = points[i - 1]
        const alpha = (1 - pt.age / 1) * 0.6
        const width = (1 - pt.age / 1) * (2 + pt.speed * 0.5)
        return (
          <line
            key={i}
            x1={prev.x} y1={prev.y}
            x2={pt.x} y2={pt.y}
            stroke={`rgba(0,212,255,${alpha})`}
            strokeWidth={width}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}