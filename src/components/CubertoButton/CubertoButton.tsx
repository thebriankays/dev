'use client'

import React, { useEffect, useRef } from 'react'
import './CubertoButton.scss'

interface CubertoButtonProps {
  text: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
}

export function CubertoButton({ text, onClick, type = 'button', disabled, isLoading }: CubertoButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const displayText = isLoading ? 'LOGGING IN...' : text
      const chars = displayText.split('')
      textRef.current.innerHTML = chars
        .map((char, index) => `<span style="--d: ${index * 0.05}s">${char === ' ' ? '&nbsp;' : char}</span>`)
        .join('')
    }
  }, [text, isLoading])

  return (
    <button
      ref={buttonRef}
      className="cuberto-button smoke"
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="cuberto-button__inner">
        <span ref={textRef} className="cuberto-button__text">{text}</span>
        <div className="cuberto-button__filler"></div>
      </div>
    </button>
  )
}