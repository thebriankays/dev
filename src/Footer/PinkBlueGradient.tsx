import React from 'react'

interface GradientProps {
  startColor?: string
  endColor?: string
  pathRef?: React.RefObject<SVGPathElement | null>
}

export const PinkBlueGradient: React.FC<GradientProps> = ({
  startColor = '#fec5fb',
  endColor = '#00bae2',
  pathRef,
}) => (
  <svg
    preserveAspectRatio="none"
    className="footer-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 2278 683"
  >
    <defs>
      <linearGradient
        id="footer-gradient"
        x1="0"
        y1="0"
        x2="2278"
        y2="683"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.2" stopColor={startColor}></stop>
        <stop offset="0.8" stopColor={endColor}></stop>
      </linearGradient>
    </defs>
    <path
      ref={pathRef}
      className="footer-svg"
      id="footer-bouncy-path"
      fill="url(#footer-gradient)"
      d="M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z"
    />
  </svg>
)