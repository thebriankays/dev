'use client'

import React from 'react'
import { CubertoButton } from '@/components/CubertoButton'

interface CubertoButtonVariationProps {
  text: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function CubertoButtonVariation({ 
  text, 
  onClick, 
  type = 'button', 
  disabled, 
  isLoading, 
  className = '' 
}: CubertoButtonVariationProps) {
  return (
    <div className={className}>
      <CubertoButton
        text={text}
        onClick={onClick}
        type={type}
        disabled={disabled}
        isLoading={isLoading}
      />
    </div>
  )
}