'use client'

import React from 'react'
import type { CellComponentProps } from './types'

const FlagCell: React.FC<CellComponentProps> = ({ cellData }) => {
  const countryCode = cellData as string
  
  if (!countryCode) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }
  
  // Convert country code to flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem' 
    }}>
      <span style={{ fontSize: '1.5rem' }}>
        {getFlagEmoji(countryCode)}
      </span>
      <span style={{ 
        fontFamily: 'monospace', 
        fontSize: '0.875rem',
        color: 'var(--theme-text-light)'
      }}>
        {countryCode.toUpperCase()}
      </span>
    </div>
  )
}

export default FlagCell