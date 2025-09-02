'use client'

import React from 'react'

interface CellComponentProps {
  cellData: string | { name?: string; flag?: string } | null | undefined
  rowData: {
    [key: string]: unknown
  }
}

const CountryCell: React.FC<CellComponentProps> = ({ cellData, rowData }) => {
  // First check if we have a countryRelation object
  const countryData = rowData.countryRelation || cellData
  
  if (!countryData) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }

  // Handle relationship field
  if (typeof countryData === 'object' && countryData.name) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        {countryData.flag && (
          <span style={{ fontSize: '1.25rem' }}>{
            // Convert flag filename to emoji
            (() => {
              const flagFile = countryData.flag
              if (flagFile && flagFile.includes('.svg')) {
                const code = flagFile.replace('.svg', '').toUpperCase()
                if (code.length === 2) {
                  const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0))
                  return String.fromCodePoint(...codePoints)
                }
              }
              return flagFile
            })()
          }</span>
        )}
        <span>{countryData.name}</span>
      </div>
    )
  }
  
  // Handle simple string
  if (typeof countryData === 'string') {
    return <span>{countryData}</span>
  }
  
  // Fallback for unexpected types
  return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
}

export default CountryCell