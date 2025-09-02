'use client'

import React from 'react'

interface CellComponentProps {
  cellData: string | null | undefined
  rowData: {
    [key: string]: unknown
  }
}

const ContinentCell: React.FC<CellComponentProps> = ({ cellData }) => {
  if (!cellData) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }
  
  const continentColors: Record<string, string> = {
    'Africa': '#FF6B6B',
    'Asia': '#4ECDC4',
    'Europe': '#45B7D1',
    'North America': '#96CEB4',
    'South America': '#FECA57',
    'Oceania': '#DDA0DD',
    'Antarctica': '#B0C4DE',
  }
  
  return (
    <span style={{ 
      backgroundColor: continentColors[cellData] || '#E0E0E0',
      color: '#fff',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      display: 'inline-block'
    }}>
      {cellData}
    </span>
  )
}

export default ContinentCell