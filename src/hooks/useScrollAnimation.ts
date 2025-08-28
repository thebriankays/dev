'use client'

import { useRef, MutableRefObject } from 'react'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface ScrollAnimationOptions {
  trigger?: MutableRefObject<HTMLElement | null>
  animation: 'fadeIn' | 'fadeUp' | 'fadeDown' | 'slideIn' | 'slideOut' | 'scale' | 'parallax' | 'custom'
  customAnimation?: (element: HTMLElement, gsap: typeof import('gsap').gsap) => gsap.core.Tween | gsap.core.Timeline
  start?: string
  end?: string
  scrub?: boolean | number
  pin?: boolean
  pinSpacing?: boolean
  markers?: boolean
  toggleActions?: string
  duration?: number
  delay?: number
  ease?: string
  stagger?: number | object
  parallaxSpeed?: number
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
  onToggle?: (self: ScrollTrigger) => void
}

export function useScrollAnimation(options: ScrollAnimationOptions) {
  const defaultRef = useRef<HTMLElement | null>(null)
  const elementRef = options.trigger || defaultRef

  useGSAP((context, requestRender) => {
    if (!elementRef.current || !context) return

    const element = elementRef.current
    
    let animation: gsap.core.Tween | gsap.core.Timeline

    if (options.customAnimation) {
      animation = options.customAnimation(element, gsap)
    } else {
      switch (options.animation) {
        case 'fadeIn':
          gsap.set(element, { opacity: 0 })
          animation = gsap.to(element, {
            opacity: 1,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'power2.out',
            stagger: options.stagger,
          })
          break

        case 'fadeUp':
          gsap.set(element, { opacity: 0, y: 50 })
          animation = gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'power2.out',
            stagger: options.stagger,
          })
          break

        case 'fadeDown':
          gsap.set(element, { opacity: 0, y: -50 })
          animation = gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'power2.out',
            stagger: options.stagger,
          })
          break

        case 'slideIn':
          gsap.set(element, { x: -100, opacity: 0 })
          animation = gsap.to(element, {
            x: 0,
            opacity: 1,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'power2.out',
            stagger: options.stagger,
          })
          break

        case 'slideOut':
          gsap.set(element, { x: 100, opacity: 0 })
          animation = gsap.to(element, {
            x: 0,
            opacity: 1,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'power2.out',
            stagger: options.stagger,
          })
          break

        case 'scale':
          gsap.set(element, { scale: 0, opacity: 0 })
          animation = gsap.to(element, {
            scale: 1,
            opacity: 1,
            duration: options.duration || 1,
            delay: options.delay || 0,
            ease: options.ease || 'back.out(1.7)',
            stagger: options.stagger,
          })
          break

        case 'parallax':
          const speed = options.parallaxSpeed || 0.5
          animation = gsap.to(element, {
            yPercent: -100 * speed,
            ease: 'none',
          })
          break

        default:
          animation = gsap.to(element, {})
      }
    }

    // Create ScrollTrigger
    ScrollTrigger.create({
      trigger: element,
      animation: options.scrub ? animation : undefined,
      start: options.start || 'top 80%',
      end: options.end || (options.animation === 'parallax' ? 'bottom top' : 'bottom 20%'),
      scrub: options.scrub || (options.animation === 'parallax' ? true : false),
      pin: options.pin,
      pinSpacing: options.pinSpacing,
      markers: options.markers,
      toggleActions: options.toggleActions || (options.scrub ? undefined : 'play none none reverse'),
      onEnter: () => {
        options.onEnter?.()
        requestRender()
      },
      onLeave: () => {
        options.onLeave?.()
        requestRender()
      },
      onEnterBack: () => {
        options.onEnterBack?.()
        requestRender()
      },
      onLeaveBack: () => {
        options.onLeaveBack?.()
        requestRender()
      },
      onToggle: (self) => {
        options.onToggle?.(self)
        requestRender()
      },
      onUpdate: () => {
        requestRender()
      },
    })

    // If not using scrub and not parallax, pause the animation initially
    if (!options.scrub && options.animation !== 'parallax') {
      animation.pause()
    }
  }, [options])

  return elementRef
}