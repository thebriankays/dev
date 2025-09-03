'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@/providers/Animation'
import { PinkBlueGradient } from './PinkBlueGradient'
import type { Footer } from '@/payload-types'
import './styles.scss'


interface FooterClientProps {
  footer: Footer
  children: React.ReactNode
}

export function FooterClient({ footer, children }: FooterClientProps) {
  const footerRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  // Animate footer with Lenis scroll integration
  useGSAP((_context, requestRender) => {
    if (!footerRef.current || !pathRef.current) return
    
    // Set initial state
    gsap.set(footerRef.current, { opacity: 0, y: 50 })
    
    // Create entrance animation
    ScrollTrigger.create({
      trigger: footerRef.current,
      start: 'top 90%',
      onEnter: () => {
        // Animate footer entrance
        gsap.to(footerRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out'
        })
      },
      once: true
    })

    // Use Hamo for the wobbly path animation with momentum
    const pathElement = pathRef.current
    
    // State for wobbly animation
    let currentCurve = 0
    let targetCurve = 0
    let velocity = 0
    
    // Create ScrollTrigger for continuous updates
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // Use scroll velocity from Lenis for natural movement
        const progress = self.progress
        const scrollVelocity = self.getVelocity() // Get velocity from ScrollTrigger
        
        // Calculate target curve based on scroll position and velocity
        targetCurve = Math.sin(progress * Math.PI * 4) * 30 + (scrollVelocity * 0.01)
        
        // Add to velocity
        velocity += (targetCurve - currentCurve) * 0.02
        velocity *= 0.92 // Damping
        
        // Update current curve with momentum
        currentCurve += velocity
        
        // Apply the curve to the path
        const curve = currentCurve
        const newPath = `M0-0.3C0-0.3,464,${156 + curve},1139,${156 + curve}S2278-0.3,2278-0.3V683H0V-0.3z`
        pathElement.setAttribute('d', newPath)
        
        // Request render for WebGL if needed
        requestRender()
      }
    })
    
    
    // Add breathing animation using GSAP timeline
    const breathingTl = gsap.timeline({ repeat: -1 })
    
    breathingTl.to({}, {
      duration: 4,
      ease: 'sine.inOut',
      onUpdate: function() {
        const progress = this.progress()
        const breathCurve = Math.sin(progress * Math.PI * 2) * 5
        
        // Get current curve value from the path
        const currentPath = pathElement.getAttribute('d') || ''
        const match = currentPath.match(/C0-0\.3,464,([\d.-]+),1139/)
        const currentY = match ? parseFloat(match[1]) : 156
        
        // Apply breathing on top of current position
        const baseY = currentY - (currentY - 156) % 10 // Remove old breath component
        const newPath = `M0-0.3C0-0.3,464,${baseY + breathCurve},1139,${baseY + breathCurve}S2278-0.3,2278-0.3V683H0V-0.3z`
        pathElement.setAttribute('d', newPath)
      }
    })
  }, [])

  return (
    <footer ref={footerRef} className="footer">
      {footer.backgroundStyle === 'gradient' ? (
        <PinkBlueGradient
          startColor={footer.gradientStartColor || undefined}
          endColor={footer.gradientEndColor || undefined}
          pathRef={pathRef}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: footer.backgroundColor || undefined }}
        />
      )}
      <div
        className={`container relative py-8 gap-8 flex flex-col md:flex-row md:justify-between text-white ${
          !footer.enableNoise ? 'after:hidden' : ''
        }`}
      >
        {children}
      </div>
    </footer>
  )
}