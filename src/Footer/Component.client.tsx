'use client'

import React, { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP, useAnimation } from '@/providers/Animation'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Animate footer with proper GSAP/Lenis integration
  useGSAP((context, requestRender) => {
    if (!footerRef.current || !pathRef.current || !containerRef.current) return
    
    const pathElement = pathRef.current
    const footerElement = footerRef.current
    const containerElement = containerRef.current
    
    // Define path shapes
    const downPath = 'M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z'
    const centerPath = 'M0-0.3C0-0.3,464,0,1139,0S2278-0.3,2278-0.3V683H0V-0.3z'
    
    // Set initial states
    gsap.set(pathElement, { attr: { d: downPath } })
    gsap.set(containerElement, { y: '70%' })
    
    // Footer reveal animation (parallax-style)
    ScrollTrigger.create({
      trigger: footerElement,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // Reveal footer container as we scroll to bottom
        const progress = self.progress
        const yPos = gsap.utils.interpolate(70, 0, progress)
        gsap.set(containerElement, { y: `${yPos}%` })
      }
    })
    
    // Bouncy wave animation on footer reveal
    ScrollTrigger.create({
      trigger: footerElement,
      start: 'top bottom-=20vh',
      toggleActions: 'play none none reverse',
      onEnter: (self) => {
        const velocity = self.getVelocity()
        const variation = Math.abs(velocity) / 10000
        
        // Animate from down curve to center with elastic bounce
        gsap.fromTo(pathElement, {
          attr: { d: downPath }
        }, {
          duration: 2,
          attr: { d: centerPath },
          ease: `elastic.out(${1 + Math.min(variation, 0.5)}, ${0.3})`,
          overwrite: true
        })
      },
      onLeave: () => {
        // Reset to down position when scrolling back up
        gsap.to(pathElement, {
          duration: 1,
          attr: { d: downPath },
          ease: 'power2.out'
        })
      }
    })
    
    // Continuous subtle wave animation for organic feel
    let waveOffset = 0
    const continuousWave = () => {
      waveOffset += 0.02
      const waveAmplitude = 5
      const wave = Math.sin(waveOffset) * waveAmplitude
      
      // Get current path and apply subtle wave
      const currentPath = pathElement.getAttribute('d') || centerPath
      const isCenter = currentPath.includes(',0,1139,0')
      
      if (isCenter) {
        const wavyPath = `M0-0.3C0-0.3,464,${wave},1139,${wave}S2278-0.3,2278-0.3V683H0V-0.3z`
        pathElement.setAttribute('d', wavyPath)
      }
      
      requestRender()
    }
    
    gsap.ticker.add(continuousWave)
    
    // Cleanup
    return () => {
      gsap.ticker.remove(continuousWave)
    }
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
        ref={containerRef}
        className={`footer__container text-white ${
          !footer.enableNoise ? 'after:hidden' : ''
        }`}
      >
        {children}
      </div>
    </footer>
  )
}