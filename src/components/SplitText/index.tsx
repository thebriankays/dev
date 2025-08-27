'use client'

import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './split-text.scss'

export type SplitType = 'chars' | 'words' | 'lines' | 'words,lines' | 'chars,words' | 'chars,words,lines'

interface SplitTextProps {
  children: string
  type?: SplitType
  animation?: 'fadeUp' | 'fadeIn' | 'slideIn' | 'rotateIn' | 'scaleIn' | 'custom'
  stagger?: number
  duration?: number
  delay?: number
  ease?: string
  scrollTrigger?: boolean
  scrollTriggerOptions?: ScrollTrigger.Vars
  className?: string
  onAnimationComplete?: () => void
  customAnimation?: (elements: Element[], gsap: typeof import('gsap').gsap) => gsap.core.Timeline
}

export function SplitText({
  children,
  type = 'words',
  animation = 'fadeUp',
  stagger = 0.02,
  duration = 0.6,
  delay = 0,
  ease = 'power3.out',
  scrollTrigger = true,
  scrollTriggerOptions = {},
  className = '',
  onAnimationComplete,
  customAnimation,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const elementsRef = useRef<Element[]>([])

  // Split text into elements
  useEffect(() => {
    if (!containerRef.current || !children) return

    const splitIntoElements = () => {
      const container = containerRef.current!
      container.innerHTML = '' // Clear existing content

      if (type.includes('lines')) {
        // First, wrap everything in a temporary container to measure lines
        const temp = document.createElement('div')
        temp.style.visibility = 'hidden'
        temp.style.position = 'absolute'
        temp.innerHTML = children
        container.appendChild(temp)

        // Get line breaks
        const words = children.split(' ')
        let currentLine: string[] = []
        let currentTop = 0
        const lines: string[][] = []

        // Create temporary spans to measure positions
        temp.innerHTML = ''
        words.forEach((word, index) => {
          const span = document.createElement('span')
          span.textContent = word + (index < words.length - 1 ? ' ' : '')
          temp.appendChild(span)
        })

        // Group words by line
        const spans = temp.querySelectorAll('span')
        spans.forEach((span, index) => {
          const top = span.offsetTop
          if (top !== currentTop && currentLine.length > 0) {
            lines.push([...currentLine])
            currentLine = []
            currentTop = top
          }
          currentLine.push(words[index])
        })
        if (currentLine.length > 0) {
          lines.push(currentLine)
        }

        // Remove temp container
        container.removeChild(temp)

        // Create line elements
        lines.forEach((line, lineIndex) => {
          const lineEl = document.createElement('span')
          lineEl.className = 'split-line'
          lineEl.setAttribute('data-line', lineIndex.toString())

          if (type === 'lines') {
            lineEl.textContent = line.join(' ')
            elementsRef.current.push(lineEl)
          } else {
            // Split further into words or chars
            line.forEach((word, wordIndex) => {
              if (type.includes('words')) {
                const wordEl = document.createElement('span')
                wordEl.className = 'split-word'
                wordEl.setAttribute('data-word', `${lineIndex}-${wordIndex}`)

                if (type.includes('chars')) {
                  // Split into chars
                  word.split('').forEach((char, charIndex) => {
                    const charEl = document.createElement('span')
                    charEl.className = 'split-char'
                    charEl.textContent = char
                    charEl.setAttribute('data-char', `${lineIndex}-${wordIndex}-${charIndex}`)
                    wordEl.appendChild(charEl)
                    elementsRef.current.push(charEl)
                  })
                } else {
                  wordEl.textContent = word
                  elementsRef.current.push(wordEl)
                }

                lineEl.appendChild(wordEl)
                if (wordIndex < line.length - 1) {
                  lineEl.appendChild(document.createTextNode(' '))
                }
              } else if (type.includes('chars')) {
                // Just chars within lines
                const wordText = word + (wordIndex < line.length - 1 ? ' ' : '')
                wordText.split('').forEach((char, charIndex) => {
                  const charEl = document.createElement('span')
                  charEl.className = 'split-char'
                  charEl.textContent = char
                  charEl.setAttribute('data-char', `${lineIndex}-${wordIndex}-${charIndex}`)
                  lineEl.appendChild(charEl)
                  elementsRef.current.push(charEl)
                })
              }
            })
          }

          container.appendChild(lineEl)
        })
      } else if (type === 'words') {
        const words = children.split(' ')
        words.forEach((word, index) => {
          const wordEl = document.createElement('span')
          wordEl.className = 'split-word'
          wordEl.textContent = word
          wordEl.setAttribute('data-word', index.toString())
          elementsRef.current.push(wordEl)
          container.appendChild(wordEl)
          if (index < words.length - 1) {
            container.appendChild(document.createTextNode(' '))
          }
        })
      } else if (type === 'chars') {
        children.split('').forEach((char, index) => {
          const charEl = document.createElement('span')
          charEl.className = 'split-char'
          charEl.textContent = char
          charEl.setAttribute('data-char', index.toString())
          elementsRef.current.push(charEl)
          container.appendChild(charEl)
        })
      }

      setIsReady(true)
    }

    splitIntoElements()

    return () => {
      elementsRef.current = []
      setIsReady(false)
    }
  }, [children, type])

  // Animate elements
  useGSAP((context) => {
    if (!isReady || elementsRef.current.length === 0 || !context) return

    let tl: gsap.core.Timeline

    if (customAnimation) {
      tl = customAnimation(elementsRef.current, gsap)
    } else {
      tl = context.add(() => {
        const timeline = gsap.timeline({
          delay,
          onComplete: onAnimationComplete,
        })

        // Set initial states based on animation type
        const elements = elementsRef.current
        switch (animation) {
          case 'fadeUp':
            gsap.set(elements, { opacity: 0, y: 20 })
            timeline.to(elements, {
              opacity: 1,
              y: 0,
              duration,
              stagger,
              ease,
            })
            break

          case 'fadeIn':
            gsap.set(elements, { opacity: 0 })
            timeline.to(elements, {
              opacity: 1,
              duration,
              stagger,
              ease,
            })
            break

          case 'slideIn':
            gsap.set(elements, { x: -30, opacity: 0 })
            timeline.to(elements, {
              x: 0,
              opacity: 1,
              duration,
              stagger,
              ease,
            })
            break

          case 'rotateIn':
            gsap.set(elements, { rotationX: 90, opacity: 0, transformPerspective: 600 })
            timeline.to(elements, {
              rotationX: 0,
              opacity: 1,
              duration,
              stagger,
              ease,
            })
            break

          case 'scaleIn':
            gsap.set(elements, { scale: 0, opacity: 0 })
            timeline.to(elements, {
              scale: 1,
              opacity: 1,
              duration,
              stagger,
              ease,
            })
            break
        }

        return timeline
      })
    }

    // Add ScrollTrigger if enabled
    if (scrollTrigger && tl) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 80%',
        onEnter: () => tl.play(),
        onLeaveBack: () => tl.reverse(),
        ...scrollTriggerOptions,
      })
      tl.pause()
    }
  }, [isReady, animation, stagger, duration, delay, ease, scrollTrigger, onAnimationComplete])

  return (
    <div 
      ref={containerRef}
      className={`split-text split-text--${type.replace(',', '-')} ${className}`}
    >
      {/* Content will be dynamically inserted */}
    </div>
  )
}