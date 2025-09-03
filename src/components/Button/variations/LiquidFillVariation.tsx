'use client'

import React from 'react'
import './LiquidFillVariation.scss'

interface LiquidFillVariationProps {
  text: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function LiquidFillVariation({ 
  text, 
  onClick, 
  type = 'button', 
  disabled, 
  isLoading, 
  className = '' 
}: LiquidFillVariationProps) {
  const displayText = isLoading ? 'LOADING...' : text

  return (
    <button
      className={`liquid-fill-variation ${className}`}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <span className="liquid-fill-variation__text">{displayText}</span>
    </button>
  )
}