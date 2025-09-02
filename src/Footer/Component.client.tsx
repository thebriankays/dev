'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@/providers/Animation'
import { PinkBlueGradient } from './PinkBlueGradient'
import type { Footer } from '@/payload-types'
import './styles.scss'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}


interface FooterClientProps {
  footer: Footer
  children: React.ReactNode
}

export function FooterClient({ footer, children }: FooterClientProps) {
  const footerRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  // Animate footer entrance with scale and opacity
  useGSAP(() => {
    // Import gsap and ScrollTrigger from the global scope
    // They are already registered by the AnimationProvider
    if (!footerRef.current) return
    
    // Set initial state
    gsap.set(footerRef.current, { opacity: 0, y: 50 })
    if (pathRef.current) {
      gsap.set(pathRef.current, { scaleY: 0.8, transformOrigin: 'center bottom' })
    }

    // Create scroll trigger animation
    ScrollTrigger.create({
      trigger: footerRef.current,
      start: 'top 90%',
      toggleActions: 'play none none reverse',
      onEnter: () => {
        // Animate footer entrance
        gsap.to(footerRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out'
        })
        
        // Animate the SVG path with a bouncy effect
        if (pathRef.current) {
          gsap.to(pathRef.current, {
            scaleY: 1,
            duration: 1.5,
            ease: 'elastic.out(1.2, 0.5)'
          })
        }
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