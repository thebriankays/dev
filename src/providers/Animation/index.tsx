'use client'

import React, { createContext, useContext, ReactNode, useEffect, useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Hamo } from '@/webgl/libs/hamo'
import { Tempus } from '@/webgl/libs/tempus'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Try to import SplitText if available (premium plugin)
let SplitText: typeof gsap.plugins.SplitText | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SplitTextModule = require('gsap/SplitText')
  SplitText = SplitTextModule.SplitText || SplitTextModule.default
  if (SplitText) {
    gsap.registerPlugin(SplitText)
  }
} catch {
  console.log('GSAP SplitText not available - using manual text splitting')
}

interface AnimationContextValue {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  SplitText: typeof gsap.plugins.SplitText | null
  lenis: Lenis | null
  hamo: Hamo | null
  tempus: Tempus | null
  scroll: number
  velocity: number
  requestRender: () => void
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
  callback: (context: gsap.Context, requestRender: () => void) => void,
  deps: React.DependencyList = []
) => {
  const contextRef = useRef<gsap.Context | null>(null)
  const canvasContext = useContext(AnimationContext)
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  
  useLayoutEffect(() => {
    contextRef.current = gsap.context(() => {
      callbackRef.current(contextRef.current!, canvasContext?.requestRender || (() => {}))
    })

    return () => {
      contextRef.current?.revert()
    }
  }, [canvasContext?.requestRender, ...deps])

  return contextRef.current
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const hamoRef = useRef<Hamo | null>(null)
  const tempusRef = useRef<Tempus | null>(null)
  const scrollRef = useRef(0)
  const velocityRef = useRef(0)
  
  // Create a default requestRender function
  const requestRenderRef = useRef<() => void>(() => {})
  
  // Try to get the actual requestRender from Canvas context if available
  useEffect(() => {
    // This will run after the component mounts, avoiding the SSR issue
    if (typeof window !== 'undefined' && (window as unknown as { __r3f?: { invalidate: () => void } }).__r3f) {
      requestRenderRef.current = () => {
        const r3f = (window as unknown as { __r3f?: { invalidate: () => void } }).__r3f
        if (r3f) {
          r3f.invalidate()
        }
      }
    }
  }, [])

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
      // Prevent smooth scroll on Payload admin elements and scrollable containers
      prevent: (node: HTMLElement) => {
        // Check if the element or its parents have specific classes or attributes
        let element: HTMLElement | null = node
        while (element) {
          // Check for Payload admin classes or scrollable elements
          if (element.classList?.contains('payload__modal-container') ||
              element.classList?.contains('payload__scroll-container') ||
              element.classList?.contains('payload-scrollbar') ||
              element.classList?.contains('monaco-editor') ||
              element.getAttribute?.('data-lenis-prevent') !== null ||
              element.getAttribute?.('data-payload-scroll') !== null) {
            return true
          }
          
          // Check if element has overflow scroll/auto
          const style = window.getComputedStyle(element)
          if ((style.overflowY === 'scroll' || style.overflowY === 'auto') && 
              element.scrollHeight > element.clientHeight) {
            return true
          }
          
          element = element.parentElement
        }
        return false
      },
    })

    // Initialize Hamo animation library
    hamoRef.current = new Hamo()

    // Initialize Tempus time control
    tempusRef.current = new Tempus()

    // Sync Lenis with ScrollTrigger
    lenisRef.current.on('scroll', (e: { animatedScroll: number; velocity: number }) => {
      scrollRef.current = e.animatedScroll
      velocityRef.current = e.velocity
      ScrollTrigger.update()
      // Request render on scroll for WebGL animations tied to scroll
      requestRenderRef.current()
    })

    // Update ScrollTrigger on Lenis scroll
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
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
    let rafId: number
    const raf = (time: number) => {
      lenisRef.current?.raf(time)
      hamoRef.current?.update(time)
      tempusRef.current?.update(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    // Handle resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      lenisRef.current?.destroy()
      hamoRef.current?.destroy()
      tempusRef.current?.destroy()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const value: AnimationContextValue = {
    gsap,
    ScrollTrigger,
    SplitText,
    lenis: lenisRef.current,
    hamo: hamoRef.current,
    tempus: tempusRef.current,
    scroll: scrollRef.current,
    velocity: velocityRef.current,
    requestRender: requestRenderRef.current,
  }

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  )
}