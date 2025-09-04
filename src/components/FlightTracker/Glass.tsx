'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utilities/ui'
import './glass.scss'

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'panel'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  blur?: number
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

const Glass = forwardRef<HTMLDivElement, GlassProps>(
  (
    {
      variant = 'default',
      rounded = 'md',
      blur = 12,
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const getBorderRadius = () => {
      switch (rounded) {
        case 'none':
          return '0'
        case 'sm':
          return '0.375rem'
        case 'md':
          return '0.5rem'
        case 'lg':
          return '1rem'
        case 'xl':
          return '1.5rem'
        default:
          return '0.5rem'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'glass-container',
          `glass-variant-${variant}`,
          className,
        )}
        style={{
          '--glass-radius': getBorderRadius(),
          '--glass-blur': `${blur}px`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <div className="glass-filter" />
        <div className="glass-overlay" />
        <div className="glass-content">{children}</div>
      </div>
    )
  },
)

Glass.displayName = 'Glass'

export { Glass }