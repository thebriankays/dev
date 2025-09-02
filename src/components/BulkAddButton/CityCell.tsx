'use client'

import React from 'react'

interface CellComponentProps {
  cellData: string | null | undefined
  rowData: {
    state?: string
    [key: string]: unknown
  }
}

const CityCell: React.FC<CellComponentProps> = ({ cellData, rowData }) => {
  if (!cellData) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }
  
  // Just show the city name without state
  // State should be in its own column if needed
  return <span>{cellData}</span>
}

export default CityCell