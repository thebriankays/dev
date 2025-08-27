'use client'

import React, { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react'
import MouseFollower from 'mouse-follower'
import gsap from 'gsap'
import './mouse-follower.scss'

interface MouseFollowerContextValue {
  cursor: MouseFollower | null
  x: number
  y: number
  setStick: (element: HTMLElement) => void
  removeStick: () => void
  setText: (text: string) => void
  removeText: () => void
  setIcon: (icon: string) => void
  removeIcon: () => void
  setImg: (src: string) => void
  removeImg: () => void
  setVideo: (src: string) => void
  removeVideo: () => void
  addState: (state: string) => void
  removeState: (state: string) => void
  setSkewing: (value: number) => void
  removeSkewing: () => void
  show: () => void
  hide: () => void
}

const MouseFollowerContext = createContext<MouseFollowerContextValue | null>(null)

export const useMouse = () => {
  const context = useContext(MouseFollowerContext)
  if (!context) {
    throw new Error('useMouse must be used within MouseFollowerProvider')
  }
  return context
}

export const useCursorState = (state: string, element?: HTMLElement) => {
  const { addState, removeState } = useMouse()
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = element || ref.current
    if (!el) return

    const handleEnter = () => addState(state)
    const handleLeave = () => removeState(state)

    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)

    return () => {
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [state, element, addState, removeState])

  return ref
}

export function MouseFollowerProvider({ children }: { children: ReactNode }) {
  const [cursor, setCursor] = useState<MouseFollower | null>(null)
  const cursorRef = useRef<MouseFollower | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Register GSAP with MouseFollower
    MouseFollower.registerGSAP(gsap)

    // Initialize cursor with custom options
    const cursorInstance = new MouseFollower({
      container: document.body,
      speed: 0.5,
      ease: 'expo.out',
      skewing: 2,
      skewingText: 3,
      skewingIcon: 2,
      skewingMedia: 2,
      skewingDelta: 0.001,
      skewingDeltaMax: 0.15,
      stickDelta: 0.15,
      showTimeout: 20,
      hideTimeout: 300,
      iconSvgClassName: 'mf-svgsprite',
      iconSvgNamePrefix: '-',
      iconSvgSrc: '',
      stateDetection: {
        '-pointer': 'a, button',
        '-hidden': 'iframe',
        '-text': '[data-cursor-text]',
        '-icon': '[data-cursor-icon]',
        '-img': '[data-cursor-img]',
        '-video': '[data-cursor-video]',
        '-stick': '[data-cursor-stick]',
      },
    })

    cursorRef.current = cursorInstance
    setCursor(cursorInstance)

    // Track mouse position normalized between -1 and 1
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (cursorRef.current) {
        cursorRef.current.destroy()
      }
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Cursor control methods
  const value: MouseFollowerContextValue = {
    cursor,
    x: mousePosition.x,
    y: mousePosition.y,
    setStick: (element: HTMLElement) => cursorRef.current?.setStick(element),
    removeStick: () => cursorRef.current?.removeStick(),
    setText: (text: string) => cursorRef.current?.setText(text),
    removeText: () => cursorRef.current?.removeText(),
    setIcon: (icon: string) => cursorRef.current?.setIcon(icon),
    removeIcon: () => cursorRef.current?.removeIcon(),
    setImg: (src: string) => cursorRef.current?.setImg(src),
    removeImg: () => cursorRef.current?.removeImg(),
    setVideo: (src: string) => cursorRef.current?.setVideo(src),
    removeVideo: () => cursorRef.current?.removeVideo(),
    addState: (state: string) => cursorRef.current?.addState(state),
    removeState: (state: string) => cursorRef.current?.removeState(state),
    setSkewing: (value: number) => cursorRef.current?.setSkewing(value),
    removeSkewing: () => cursorRef.current?.removeSkewing(),
    show: () => cursorRef.current?.show(),
    hide: () => cursorRef.current?.hide(),
  }

  return (
    <MouseFollowerContext.Provider value={value}>
      {children}
    </MouseFollowerContext.Provider>
  )
}