import { forwardRef } from 'react'

interface ShipProps {
  tiltX: number
  glowIntensity: number
}

const Ship = forwardRef<SVGSVGElement, ShipProps>(({ tiltX, glowIntensity }, ref) => (
  <svg
    ref={ref}
    width="36" height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: `rotate(${tiltX}deg)`, overflow: 'visible' }}
  >
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="bodyGrad" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E8F4FF" />
        <stop offset="50%" stopColor="#B0C8E8" />
        <stop offset="100%" stopColor="#7090B0" />
      </linearGradient>
      <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#90B8D8" />
        <stop offset="100%" stopColor="#4070A0" />
      </linearGradient>
      <radialGradient id="engineGlow" cx="50%" cy="100%" r="50%">
        <stop offset="0%" stopColor={`rgba(0,212,255,${glowIntensity * 0.3})`} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>

    {/* Engine glow behind ship */}
    <ellipse cx="18" cy="30" rx="8" ry="5" fill="url(#engineGlow)" filter="url(#glow)" />

    {/* Left wing */}
    <path d="M18 20 L4 28 L10 24 Z" fill="url(#wingGrad)" opacity="0.9" />
    {/* Right wing */}
    <path d="M18 20 L32 28 L26 24 Z" fill="url(#wingGrad)" opacity="0.9" />

    {/* Main body */}
    <path d="M18 2 L24 20 L18 24 L12 20 Z" fill="url(#bodyGrad)" filter="url(#glow)" />

    {/* Cockpit */}
    <ellipse cx="18" cy="12" rx="3.5" ry="5" fill="#00D4FF" opacity="0.85" filter="url(#glow)" />
    <ellipse cx="18" cy="11" rx="2" ry="3" fill="#E8F8FF" opacity="0.6" />

    {/* Engine nozzle */}
    <rect x="15" y="22" width="6" height="4" rx="1" fill="#5090C0" />

    {/* Engine flame */}
    <ellipse cx="18" cy="27" rx={3 + glowIntensity * 0.5} ry={2 + glowIntensity * 0.3}
      fill={`rgba(0,212,255,${0.6 + glowIntensity * 0.1})`} filter="url(#glow)" />

    {/* Wing accent lights */}
    <circle cx="6" cy="27" r="1.2" fill="#00D4FF" opacity={0.5 + glowIntensity * 0.1} filter="url(#glow)" />
    <circle cx="30" cy="27" r="1.2" fill="#00D4FF" opacity={0.5 + glowIntensity * 0.1} filter="url(#glow)" />

    {/* Scan light (idle animation handled in parent) */}
    <circle cx="18" cy="8" r="1" fill="white" opacity="0.9" />
  </svg>
))

Ship.displayName = 'Ship'
export default Ship