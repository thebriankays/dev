'use client'

import React from 'react'

interface CellComponentProps {
  cellData: string | null | undefined
  rowData: {
    flagSvg?: string
    countryRelation?: {
      flag?: string
      code?: string
    }
    [key: string]: unknown
  }
}

const FlagCell: React.FC<CellComponentProps> = ({ cellData, rowData }) => {
  // Since 'flag' is a UI field, cellData will be undefined
  // We need to get the country code from rowData
  
  // Get country code from various sources
  let countryCode = null
  
  // First check countryRelation object
  if (rowData?.countryRelation && typeof rowData.countryRelation === 'object') {
    // The flag field contains a filename like "us.svg", so extract the code
    if (rowData.countryRelation.flag) {
      const flagFile = rowData.countryRelation.flag
      // Extract country code from filename (e.g., "us.svg" -> "US")
      countryCode = flagFile.replace('.svg', '').toUpperCase()
    } else if (rowData.countryRelation.code) {
      countryCode = rowData.countryRelation.code
    }
  }
  
  // Fallback to flagSvg field (virtual field that pulls from countryRelation)
  if (!countryCode && rowData?.flagSvg) {
    // Also handle if it's a filename
    const flagValue = rowData.flagSvg
    if (flagValue.includes('.svg')) {
      countryCode = flagValue.replace('.svg', '').toUpperCase()
    } else {
      countryCode = flagValue
    }
  }
  
  // Debug if still no country code
  if (!countryCode) {
    console.log('FlagCell: No country code found', { rowData, countryRelation: rowData?.countryRelation })
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }
  
  // Convert country code to flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    // Ensure we have a 2-letter code
    if (!countryCode || countryCode.length !== 2) {
      return countryCode // Return as-is if not a valid code
    }
    
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