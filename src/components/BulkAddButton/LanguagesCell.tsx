'use client'

import React from 'react'

interface CellComponentProps {
  cellData: any
  rowData: any
}

const LanguagesCell: React.FC<CellComponentProps> = ({ cellData }) => {
  if (!cellData || !Array.isArray(cellData)) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }

  const languages = cellData.map(lang => {
    if (typeof lang === 'object' && lang.name) {
      return lang.name
    }
    return lang
  }).filter(Boolean)

  if (languages.length === 0) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.25rem',
      flexWrap: 'wrap'
    }}>
      {languages.map((lang, index) => (
        <span
          key={index}
          style={{
            padding: '0.125rem 0.5rem',
            backgroundColor: 'var(--theme-bg-light)',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--theme-text)'
          }}
        >
          {lang}
        </span>
      ))}
    </div>
  )
}

export default LanguagesCell