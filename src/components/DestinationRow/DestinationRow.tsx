'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useConfig } from '@payloadcms/ui'

interface DestinationRowProps {
  rowData: {
    id?: string
    [key: string]: unknown
  }
  className?: string
  children?: React.ReactNode
}

export const DestinationRow: React.FC<DestinationRowProps> = ({ 
  rowData, 
  className = '',
  children 
}) => {
  const router = useRouter()
  const config = useConfig()
  const adminRoute = (config as any)?.admin?.routes?.admin || '/admin'
  
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link or button
    const target = e.target as HTMLElement
    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
      return
    }
    
    // Navigate to the destination detail page
    if (rowData?.id) {
      router.push(`${adminRoute}/collections/destinations/${rowData.id}`)
    }
  }
  
  return (
    <tr 
      className={`destination-row ${className}`}
      onClick={handleRowClick}
      style={{ 
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ''
      }}
    >
      {children}
    </tr>
  )
}

export default DestinationRow