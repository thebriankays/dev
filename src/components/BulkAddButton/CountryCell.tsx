'use client'

import React from 'react'

interface CellComponentProps {
  cellData: any
  rowData: any
}

const CountryCell: React.FC<CellComponentProps> = ({ cellData }) => {
  if (!cellData) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }

  // Handle relationship field
  if (typeof cellData === 'object' && cellData.name) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        {cellData.flag && (
          <span style={{ fontSize: '1.25rem' }}>{cellData.flag}</span>
        )}
        <span>{cellData.name}</span>
      </div>
    )
  }
  
  // Handle simple string
  return <span>{cellData}</span>
}

export default CountryCell