'use client'

import React from 'react'
import Link from 'next/link'
import { useConfig } from '@payloadcms/ui'

interface CellComponentProps {
  cellData: string | null | undefined
  rowData: {
    id?: string
    [key: string]: unknown
  }
  collectionSlug?: string
}

const TitleCell: React.FC<CellComponentProps> = ({ cellData, rowData, collectionSlug = 'destinations' }) => {
  const config = useConfig()
  const adminRoute = (config as any)?.admin?.routes?.admin || '/admin'
  
  if (!cellData || !rowData?.id) {
    return <span style={{ color: 'var(--theme-text-light)' }}>-</span>
  }
  
  return (
    <Link 
      href={`${adminRoute}/collections/${collectionSlug}/${rowData.id}`}
      style={{ 
        color: 'var(--theme-text)',
        textDecoration: 'none',
        fontWeight: 500,
        display: 'block',
        padding: '0.5rem 0',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none'
      }}
    >
      {cellData}
    </Link>
  )
}

export default TitleCell