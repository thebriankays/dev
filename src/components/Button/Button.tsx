'use client'

import React from 'react'
import { CubertoButtonVariation } from './variations/CubertoButtonVariation'
import { LiquidFillVariation } from './variations/LiquidFillVariation'
import './Button.scss'

export type ButtonVariation = 'cuberto' | 'liquid-fill'

export interface ButtonProps {
  variation: ButtonVariation
  text: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  isLoading?: boolean
  className?: string
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function Button({ 
  variation, 
  text, 
  onClick, 
  type = 'button', 
  disabled = false, 
  isLoading = false,
  className = '',
  size = 'medium',
  fullWidth = false
}: ButtonProps) {
  const baseClasses = [
    'button',
    `button--${size}`,
    fullWidth ? 'button--full-width' : '',
    className
  ].filter(Boolean).join(' ')

  const commonProps = {
    text,
    onClick,
    type,
    disabled,
    isLoading,
    className: baseClasses
  }

  switch (variation) {
    case 'cuberto':
      return <CubertoButtonVariation {...commonProps} />
    case 'liquid-fill':
      return <LiquidFillVariation {...commonProps} />
    default:
      return <CubertoButtonVariation {...commonProps} />
  }
}