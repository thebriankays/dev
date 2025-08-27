'use client'

import React, { createContext, useContext, ReactNode, useEffect, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Hamo } from '@/webgl/libs/hamo'
import { Tempus } from '@/webgl/libs/tempus'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

interface AnimationContextValue {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  lenis: Lenis | null
  hamo: Hamo | null
  tempus: Tempus | null
  scroll: number
  velocity: number
}

const AnimationContext = createContext<AnimationContextValue | null>(null)

export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }
  return context
}

// Custom hook for GSAP animations with automatic cleanup
export const useGSAP = (
  callback: (context: gsap.Context) => void,
  deps: React.DependencyList = []
) => {
  const animation = useAnimation()
  const contextRef = useRef<gsap.Context | null>(null)

  useLayoutEffect(() => {
    contextRef.current = gsap.context(() => {
      callback(contextRef.current!)
    })

    return () => {
      contextRef.current?.revert()
    }
  }, deps)

  return contextRef.current
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const hamoRef = useRef<Hamo | null>(null)
  const tempusRef = useRef<Tempus | null>(null)
  const scrollRef = useRef(0)
  const velocityRef = useRef(0)
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  useEffect(() => {
    // Initialize Lenis smooth scroll
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    })

    // Initialize Hamo animation library
    hamoRef.current = new Hamo()

    // Initialize Tempus time control
    tempusRef.current = new Tempus()

    // Sync Lenis with ScrollTrigger
    lenisRef.current.on('scroll', (e: any) => {
      scrollRef.current = e.animatedScroll
      velocityRef.current = e.velocity
      ScrollTrigger.update()
    })

    // Update ScrollTrigger on Lenis scroll
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: any) {
        if (arguments.length && lenisRef.current) {
          // Use scrollTo instead of setting scroll directly
          lenisRef.current.scrollTo(value as number, { immediate: true })
        }
        return scrollRef.current
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
    })

    ScrollTrigger.defaults({
      scroller: document.body,
    })

    // RAF loop
    const raf = (time: number) => {
      lenisRef.current?.raf(time)
      hamoRef.current?.update(time)
      tempusRef.current?.update(time)
      forceUpdate()
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      lenisRef.current?.destroy()
      hamoRef.current?.destroy()
      tempusRef.current?.destroy()
      ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill())
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const value: AnimationContextValue = {
    gsap,
    ScrollTrigger,
    lenis: lenisRef.current,
    hamo: hamoRef.current,
    tempus: tempusRef.current,
    scroll: scrollRef.current,
    velocity: velocityRef.current,
  }

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  )
}